const fs = require('fs');
const path = require('path');
const fileName = path.resolve(__dirname, './src/release.json');
const file = require(fileName);
    
file.release_date = +new Date();

console.log(file)
    
fs.writeFile(fileName, JSON.stringify(file), function writeJSON(err) {
  if (err) return console.log(err);
  console.log(JSON.stringify(file));
  console.log('writing to ' + fileName);
});