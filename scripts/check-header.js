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
  if (content.match(/import \{ SiteHeader \} from ['"]@\/components\/site-header['"]/)) {
    console.log('Still uses old import: ' + file);
    count++;
  }
});
console.log('Remaining: ' + count);
