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
  if (content.includes("from '../vendor/three.js'")) {
    content = content.replace(/from '\.\.\/vendor\/three\.js'/g, "from 'three'");
    fs.writeFileSync(f, content);
    console.log(`Reverted import path in ${f}`);
  }
});
