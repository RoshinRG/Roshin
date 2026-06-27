import * as THREE from 'three';

export class CircuitField {
  constructor() {
    this.group = new THREE.Group();
    this.isActive = true;
    
    // Read tokens from CSS variables
    const style = getComputedStyle(document.documentElement);
    const getHex = (varName) => parseInt(style.getPropertyValue(varName).trim().replace('#', '0x')) || 0x6B6B70;
    
    this.traceColor = getHex('--circuit-trace');
    this.activeColor = getHex('--rose-gold');
    
    this.clusters = [];
    this.currentActiveIndex = -1;
    this.targetColors = [];
    this.currentColors = [];
    
    this.initGeometry();
    
    // Listen for section changes from the router/scrollspy
    window.addEventListener('sectionchange', (e) => {
      this.setActiveSection(e.detail.index);
    });
  }

  initGeometry() {
    // We create 5 clusters of nodes (one for each section: home, about, projects, skills, contact)
    const numClusters = 5;
    const nodesPerCluster = window.innerWidth < 768 ? 15 : 25; // Reduce node count on mobile
    
    const positions = [];
    const colors = [];
    const sizes = [];
    
    // Line geometry for traces
    const linePositions = [];
    const lineColors = [];

    const spread = 60;
    const clusterSpacing = 40; // Y spacing between clusters

    for (let i = 0; i < numClusters; i++) {
      const clusterCenterY = (numClusters / 2 - i) * clusterSpacing;
      
      const clusterNodeIndices = [];
      
      for (let j = 0; j < nodesPerCluster; j++) {
        // Random point within a wide oval
        const x = (Math.random() - 0.5) * spread;
        const y = clusterCenterY + (Math.random() - 0.5) * (clusterSpacing * 0.8);
        const z = (Math.random() - 0.5) * 20 - 10;
        
        positions.push(x, y, z);
        
        // Initial color is trace color
        const color = new THREE.Color(this.traceColor);
        colors.push(color.r, color.g, color.b);
        sizes.push(Math.random() * 0.5 + 0.2);
        
        clusterNodeIndices.push(i * nodesPerCluster + j);
        this.currentColors.push(color.clone());
        this.targetColors.push(color.clone());
      }
      
      // Connect nodes within the cluster to form traces
      for (let j = 0; j < clusterNodeIndices.length - 1; j++) {
        if (Math.random() > 0.3) {
          const idx1 = clusterNodeIndices[j] * 3;
          const idx2 = clusterNodeIndices[j+1] * 3;
          
          linePositions.push(positions[idx1], positions[idx1+1], positions[idx1+2]);
          linePositions.push(positions[idx2], positions[idx2+1], positions[idx2+2]);
          
          const c = new THREE.Color(this.traceColor);
          lineColors.push(c.r, c.g, c.b, c.r, c.g, c.b);
        }
      }
      
      this.clusters.push({
        startIndex: i * nodesPerCluster,
        count: nodesPerCluster
      });
    }

    // Nodes Mesh
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    this.points = new THREE.Points(geometry, material);
    this.group.add(this.points);
    
    // Traces Mesh
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
    
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.2
    });
    
    this.lines = new THREE.LineSegments(lineGeo, lineMat);
    this.group.add(this.lines);
  }

  setActiveSection(index) {
    if (this.currentActiveIndex === index) return;
    this.currentActiveIndex = index;
    
    const activeColorObj = new THREE.Color(this.activeColor);
    const traceColorObj = new THREE.Color(this.traceColor);
    
    // Update target colors based on the active cluster
    for (let i = 0; i < this.clusters.length; i++) {
      const cluster = this.clusters[i];
      const targetC = (i === index) ? activeColorObj : traceColorObj;
      
      for (let j = 0; j < cluster.count; j++) {
        this.targetColors[cluster.startIndex + j].copy(targetC);
      }
    }
  }

  update(delta) {
    // Slowly drift the entire field upwards
    this.group.position.y += delta * 1.5;
    if (this.group.position.y > 40) {
      this.group.position.y = -40; // wrap around
    }

    // Lerp colors towards targets
    let colorsNeedsUpdate = false;
    const colorAttr = this.points.geometry.attributes.color;
    
    for (let i = 0; i < this.currentColors.length; i++) {
      const curr = this.currentColors[i];
      const target = this.targetColors[i];
      
      // Only lerp if they are different
      if (curr.r !== target.r || curr.g !== target.g || curr.b !== target.b) {
        curr.lerp(target, delta * 5.0); // 300ms transition roughly
        
        colorAttr.setXYZ(i, curr.r, curr.g, curr.b);
        colorsNeedsUpdate = true;
      }
    }
    
    if (colorsNeedsUpdate) {
      colorAttr.needsUpdate = true;
    }
  }

  dispose() {
    this.points.geometry.dispose();
    this.points.material.dispose();
    this.lines.geometry.dispose();
    this.lines.material.dispose();
  }
}
