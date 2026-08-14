const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Users/Niktrix/vidya/vidya';
const vas1 = path.join(rootDir, 'projects/VASCAGE/JSON.json');
const vas2 = path.join(rootDir, 'projects/VASCAGE/vascage.json');
const vit = path.join(rootDir, 'projects/VitalSense');

if (fs.existsSync(vas1)) {
  console.log('VASCAGE/JSON.json:', JSON.parse(fs.readFileSync(vas1, 'utf8')));
}
if (fs.existsSync(vas2)) {
  console.log('VASCAGE/vascage.json:', JSON.parse(fs.readFileSync(vas2, 'utf8')));
}
if (fs.existsSync(vit)) {
  console.log('VitalSense files:', fs.readdirSync(vit));
}
