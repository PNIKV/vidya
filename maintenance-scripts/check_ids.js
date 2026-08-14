const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Users/Niktrix/vidya/vidya';
const projectsDir = path.join(rootDir, 'projects');
const newprojectsDir = path.join(rootDir, 'newprojects');
const pyDir = path.join(rootDir, 'py');

const filesToCheck = [
  'projects/laser-security-system/laser-security-system.json',
  'projects/Laser Security System/Arduino code.json',
  'projects/Laser Security System/Json File.json',
  'newprojects/Laser Security System/Json File.json',
  'projects/accident-detection-system/accident-detection-system.json',
  'newprojects/Smart-Accident-Detection/Uran.json.json',
  'projects/Smart-Accident-Detection/Uran.json.json',
  'projects/automatic-school-bell-and-announcement-system/automatic-school-bell-and-announcement-system.json',
  'newprojects/Automatic-School-Bell-System/Json.file_.json',
  'projects/Bus-tracking/Bus Tracking System.json',
  'newprojects/Bus-tracking/Bus Tracking System.json',
  'projects/arduino-flight-simulator/arduino-flight-simulator.json',
  'newprojects/Arduino-Based Flight Simulator Using Joystick Project/.JSON.json',
  'projects/Assistive-Tech-blind-people copy/Json. File.json',
  'newprojects/Assistive-Tech-blind-people/Json. File.json',
  'newprojects/Assistive-Tech-blind-people/Code.json',
  'projects/sketching-live/sketching-live.json',
  'py/sketching-live.json',
  'py/Robot_Car_Project.json',
  'newprojects/Food Spoilage Detection System/JSON File.json',
  'newprojects/Food Spoilage Detection System/code.json',
  'newprojects/Medicine Dispenser/Medicine Dispenser.json',
  'newprojects/Seven Segment Display/interfacing-7-segment-display-arduino.json',
  'newprojects/Seven Segment Display/diagram.json',
  'newprojects/unihicker/NUSS.json.json'
];

for (const f of filesToCheck) {
  const full = path.join(rootDir, f);
  if (fs.existsSync(full)) {
    try {
      const data = JSON.parse(fs.readFileSync(full, 'utf8'));
      console.log(`${f}: id="${data.id}", title="${data.title}"`);
    } catch (e) {
      console.log(`${f}: ERROR reading: ${e.message}`);
    }
  } else {
    console.log(`${f}: DOES NOT EXIST`);
  }
}
