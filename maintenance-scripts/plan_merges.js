const fs = require('fs');
const path = require('path');

const analysisFile = 'C:/Users/Niktrix/.gemini/antigravity-ide/brain/1f5bb05f-fa51-4982-9cc2-a00c1f30c430/scratch/analysis_output.json';
const data = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

const projList = Object.keys(data.projects).filter(k => data.projects[k].type === 'dir');
const newProjList = Object.keys(data.newprojects).filter(k => data.newprojects[k].type === 'dir');
const pyList = Object.keys(data.py).filter(k => data.py[k].type === 'dir');

console.log('--- DIRECTORY COUNTS ---');
console.log(`projects: ${projList.length}`);
console.log(`newprojects: ${newProjList.length}`);
console.log(`py subdirs: ${pyList.length}`);

// Let's normalize project names to check for duplicates
function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const projMap = {};
for (const p of projList) {
  const norm = normalizeName(p);
  if (!projMap[norm]) projMap[norm] = [];
  projMap[norm].push({ source: 'projects', original: p, files: data.projects[p].files });
}

const newProjMap = {};
for (const p of newProjList) {
  const norm = normalizeName(p);
  if (!newProjMap[norm]) newProjMap[norm] = [];
  newProjMap[norm].push({ source: 'newprojects', original: p, files: data.newprojects[p].files });
}

// Find matches between projects and newprojects
console.log('\n--- MATCHES & MERGES (projects vs newprojects) ---');
const allNormNames = new Set([...Object.keys(projMap), ...Object.keys(newProjMap)]);

for (const norm of allNormNames) {
  const inP = projMap[norm] || [];
  const inNP = newProjMap[norm] || [];
  if (inP.length > 0 && inNP.length > 0) {
    console.log(`Match for "${norm}":`);
    console.log(`  projects: ${inP.map(x => x.original).join(', ')}`);
    console.log(`  newprojects: ${inNP.map(x => x.original).join(', ')}`);
  } else if (inP.length > 0) {
    // Only in projects
  } else if (inNP.length > 0) {
    console.log(`Only in newprojects (needs moving to projects):`);
    console.log(`  newprojects: ${inNP.map(x => x.original).join(', ')}`);
  }
}

// Look at py folder
console.log('\n--- PROJECTS IN PY FOLDER ---');
console.log('Subdirectories in py:', pyList);
console.log('Files in py:', Object.keys(data.py).filter(k => data.py[k].type === 'file'));

// Let's check which projects in projects/ do not have a .json file
console.log('\n--- MISSING JSON FILES IN PROJECTS ---');
for (const p of projList) {
  const files = data.projects[p].files;
  const hasJson = files.some(f => f.toLowerCase().endsWith('.json'));
  if (!hasJson) {
    console.log(`  Project "${p}" has no JSON file! Files:`, files);
  }
}
