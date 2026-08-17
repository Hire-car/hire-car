const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('c:/Users/yadav/Downloads/hire-car/src/app');
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.match(/import\s+\{\s*SiteHeader\s*\}\s+from\s+['"]@\/components\/site-header['"]/)) {
    content = content.replace(/import\s+\{\s*SiteHeader\s*\}\s+from\s+['"]@\/components\/site-header['"]/g, 'import { SiteHeader } from "@/components/server-site-header"');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
    count++;
  }
});
console.log(`Updated ${count} files.`);
