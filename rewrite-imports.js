const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts = ['.js']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(file, exts));
    } else {
      if (exts.includes(path.extname(file))) results.push(file);
    }
  });
  return results;
}

const files = getAllFiles('./public/js/scenes').concat(getAllFiles('./public/js/utils'));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes("import * as THREE from 'three'") || content.includes("import * as THREE from \"three\"")) {
    const used = new Set();
    const matches = content.matchAll(/THREE\.([A-Za-z0-9_]+)/g);
    for (const match of matches) {
      used.add(match[1]);
    }
    
    if (used.size > 0) {
      const namedImports = Array.from(used).sort().join(', ');
      const importStatement = `import { ${namedImports} } from '../vendor/three.js';`;
      content = content.replace(/import \* as THREE from 'three';?/g, importStatement);
      content = content.replace(/import \* as THREE from \"three\";?/g, importStatement);
      content = content.replace(/THREE\./g, '');
      fs.writeFileSync(f, content);
      console.log(`Updated ${f}`);
    } else {
      content = content.replace(/import \* as THREE from 'three';?/g, '');
      content = content.replace(/import \* as THREE from \"three\";?/g, '');
      fs.writeFileSync(f, content);
      console.log(`Removed unused three import from ${f}`);
    }
  }
});
