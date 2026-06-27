import { checkWebGLCapability } from './capability-check.js';

let isInitialized = false;

export function initThreeJS() {
  if (isInitialized) return;
  isInitialized = true;

  if (!checkWebGLCapability()) {
    document.body.classList.add('no-webgl');
    return;
  }

  // Dynamically import the heavy WebGL chunks ONLY if capability passes
  Promise.all([
    import('./renderer-core.js'),
    import('./circuit-field.js'),
    import('./hero-object.js'),
    import('./skills-cluster.js')
  ]).then(([
    { RendererCore },
    { CircuitField },
    { HeroObject },
    { SkillsCluster }
  ]) => {
    
    // 1. Initialize Single Renderer
    const core = new RendererCore('webgl-canvas');
    
    // 2. Initialize Components
    const circuitField = new CircuitField();
    const heroObject = new HeroObject();
    const skillsCluster = new SkillsCluster();

    // 3. Add to Core
    core.addComponent(circuitField);
    core.addComponent(heroObject);
    core.addComponent(skillsCluster);
    
    // 4. Start Render Loop
    core.start();

    // 5. Connect UI State (ScrollSpy to Three.js)
    window.addEventListener('sectionchange', (e) => {
      const sectionId = e.detail.id;
      
      // Skills cluster is only active when in the skills section
      if (sectionId === 'skills') {
        skillsCluster.isActive = true;
      } else {
        skillsCluster.isActive = false;
      }
      
      // We could also toggle hero visibility if scrolled far down to save render time
      if (sectionId === 'home') {
        heroObject.isActive = true;
        heroObject.mesh.visible = true;
      } else {
        heroObject.isActive = false;
        heroObject.mesh.visible = false;
      }
    });
    
  }).catch(err => {
    console.error("Failed to load WebGL modules:", err);
    document.body.classList.add('no-webgl');
  });
}
