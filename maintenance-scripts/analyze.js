const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Users/Niktrix/vidya/vidya';
const projectsDir = path.join(rootDir, 'projects');
const newprojectsDir = path.join(rootDir, 'newprojects');
const pyDir = path.join(rootDir, 'py');

function scan(dir) {
  if (!fs.existsSync(dir)) return null;
  const results = {};
  const entries = fs.readdirSync(dir);
  for (const name of entries) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      const files = fs.readdirSync(full);
      results[name] = {
        type: 'dir',
        files: files
      };
    } else {
      results[name] = {
        type: 'file',
        size: stat.size
      };
    }
  }
  return results;
}

const analysis = {
  projects: scan(projectsDir),
  newprojects: scan(newprojectsDir),
  py: scan(pyDir)
};

const outputFilePath = 'C:/Users/Niktrix/.gemini/antigravity-ide/brain/1f5bb05f-fa51-4982-9cc2-a00c1f30c430/scratch/analysis_output.json';
fs.writeFileSync(outputFilePath, JSON.stringify(analysis, null, 2));
console.log('Saved to ' + outputFilePath);
