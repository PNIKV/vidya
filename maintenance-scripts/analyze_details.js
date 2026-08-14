const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Users/Niktrix/vidya/vidya';
const projectsDir = path.join(rootDir, 'projects');
const newprojectsDir = path.join(rootDir, 'newprojects');
const pyDir = path.join(rootDir, 'py');

const targets = [
  { p: 'laser-security-system', np: 'Laser Security System' },
  { p: 'Laser Security System', np: 'Laser Security System' },
  { p: 'accident-detection-system', np: 'Smart-Accident-Detection' },
  { p: 'Smart-Accident-Detection', np: 'Smart-Accident-Detection' },
  { p: 'automatic-school-bell-and-announcement-system', np: 'Automatic-School-Bell-System' },
  { p: 'Automatic-School-Bell-System', np: 'Automatic-School-Bell-System' },
  { p: 'bus-tracking-system-at-bus-stop', np: 'Bus-tracking' },
  { p: 'Bus-tracking', np: 'Bus-tracking' },
  { p: 'arduino-flight-simulator', np: 'Arduino-Based Flight Simulator Using Joystick Project' },
  { p: 'Assistive-Tech-blind-people copy', np: 'Assistive-Tech-blind-people' },
  { p: 'sketching-live', py: 'sketching-live-main' },
  { p: 'AIR MOUSE', py: 'TESTING-Air-mouse' }
];

console.log('--- DETAILED COMPARISONS ---');
for (const t of targets) {
  const pPath = t.p ? path.join(projectsDir, t.p) : null;
  const npPath = t.np ? path.join(newprojectsDir, t.np) : null;
  const pyPath = t.py ? path.join(pyDir, t.py) : null;

  console.log(`\nComparing: P: ${t.p || 'N/A'}, NP: ${t.np || 'N/A'}, PY: ${t.py || 'N/A'}`);
  if (pPath && fs.existsSync(pPath)) {
    console.log(`  [P]  ${t.p}:`, fs.readdirSync(pPath));
  } else if (pPath) {
    console.log(`  [P]  ${t.p}: DOES NOT EXIST`);
  }
  if (npPath && fs.existsSync(npPath)) {
    console.log(`  [NP] ${t.np}:`, fs.readdirSync(npPath));
  } else if (npPath) {
    console.log(`  [NP] ${t.np}: DOES NOT EXIST`);
  }
  if (pyPath && fs.existsSync(pyPath)) {
    console.log(`  [PY] ${t.py}:`, fs.readdirSync(pyPath));
  } else if (pyPath) {
    console.log(`  [PY] ${t.py}: DOES NOT EXIST`);
  }
}

console.log('\n--- ALL EMPTY DIRECTORIES IN projects/ ---');
const allP = fs.readdirSync(projectsDir);
for (const name of allP) {
  const full = path.join(projectsDir, name);
  if (fs.statSync(full).isDirectory()) {
    const files = fs.readdirSync(full);
    if (files.length === 0) {
      console.log(`  Empty: "${name}"`);
    }
  }
}
