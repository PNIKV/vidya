const fs = require('fs');
const path = require('path');

const analysisFile = 'C:/Users/Niktrix/.gemini/antigravity-ide/brain/1f5bb05f-fa51-4982-9cc2-a00c1f30c430/scratch/analysis_output.json';
const data = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

const keys = [
  'AIR MOUSE',
  'Arduino UNO Based Countdown Timer',
  'Automatic-School-Bell-System',
  'Bus-tracking',
  'Gas-Detector',
  'Griper Robot',
  'Iot Agriculture monitoring',
  'JaRakshak',
  'keypad-door-lock',
  'Laser Security System',
  'laser-security-system',
  'Robot-Car',
  'Satellite Deep Learning Model for Land Change Detection Project',
  'Smart-Accident-Detection',
  'Smart-classroom',
  'Smart-fall-detection',
  'Smart-Flood-Alert',
  'Smart-Home-Automation',
  'Smart-vacum-cleaner',
  'Smart_parking_system',
  'SurakshaPath',
  'traffic-noise-meter',
  'unihicker',
  'VASCAGE',
  'vawt-hybrid-generator'
];

console.log('--- projects files vs newprojects files ---');
for (const k of keys) {
  console.log(`\nProject: ${k}`);
  if (data.projects[k]) {
    console.log(`  projects/   :`, data.projects[k].files);
  } else {
    console.log(`  projects/   : NOT FOUND`);
  }
  if (data.newprojects[k]) {
    console.log(`  newprojects/:`, data.newprojects[k].files);
  } else {
    console.log(`  newprojects/: NOT FOUND`);
  }
}
