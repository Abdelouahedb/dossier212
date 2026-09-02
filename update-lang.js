const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  content = content.replace(/lang \!== 'undefined' \? lang \: 'fr'/g, "lang !== 'undefined' ? lang : 'en'");
  
  if (original !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkSync(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkSync(filePath);
    } else if (file.endsWith('.ejs')) {
      replaceInFile(filePath);
    }
  }
}

walkSync(path.join(__dirname, 'views'));
console.log('Done.');
