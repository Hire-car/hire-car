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
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('import { SiteHeader } from "@/components/site-header"')) {
    content = content.replace(/import \{ SiteHeader \} from "@\/components\/site-header"/g, 'import { SiteHeader } from "@/components/server-site-header"');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
