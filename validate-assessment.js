const fs = require('node:fs');
const path = require('node:path');

const rootDir = __dirname;
const questionsFile = path.join(rootDir, 'assessment', 'beginner-questions.js');
const stylesFile = path.join(rootDir, 'assessment', 'beginner-styles.css');
const htmlFile = path.join(rootDir, 'assessment', 'index.html');

console.log('====================================================');
console.log('🔍 STEM QUEST ASSESSMENT & UI INTEGRITY AUDITOR');
console.log('====================================================\n');

let issues = [];
let warnings = [];

// 1. Audit Questions Data File
if (!fs.existsSync(questionsFile)) {
  issues.push(`CRITICAL: Questions file missing at ${questionsFile}`);
} else {
  console.log('✔ Auditing question dataset encoding & completeness...');
  const content = fs.readFileSync(questionsFile, 'utf8');

  // Check Mojibake / encoding errors
  const mojibakeRegex = /(?:ðŸ|âš|âœ|ðŸ”|â¬œ)/g;
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (mojibakeRegex.test(line)) {
      issues.push(`Encoding Error (Line ${i + 1}): Corrupted symbol found: "${line.trim()}"`);
    }
  });
  if (!issues.some(i => i.includes('Encoding Error'))) {
    console.log('   ↳ Encoding OK: No Mojibake characters detected.');
  }

  // Parse questions structure
  try {
    const rawJSON = content.replace(/^window\.BEGINNER_QUESTIONS\s*=\s*/, '').replace(/;\s*$/, '');
    const questions = JSON.parse(rawJSON);
    console.log(`   ↳ Total Questions Loaded: ${questions.length}`);

    const idSet = new Set();
    questions.forEach((q, idx) => {
      // Check duplicate ID
      if (idSet.has(q.id)) {
        issues.push(`Duplicate ID: Question at index ${idx} has duplicate ID ${q.id}`);
      }
      idSet.add(q.id);

      // Check image & audio asset paths
      if (q.image) {
        let imgPath = path.join(rootDir, q.image);
        let altImgPath = path.join(rootDir, 'assessment', q.image);
        if (!fs.existsSync(imgPath) && !fs.existsSync(altImgPath)) {
          issues.push(`Missing Image Asset: Question #${q.id} references '${q.image}', but file does not exist.`);
        }
      }

      if (q.audio) {
        let audioPath = path.join(rootDir, q.audio);
        let altAudioPath = path.join(rootDir, 'assessment', q.audio);
        if (!q.audio.startsWith('http') && !fs.existsSync(audioPath) && !fs.existsSync(altAudioPath)) {
          issues.push(`Missing Audio Asset: Question #${q.id} references '${q.audio}', but file does not exist.`);
        }
      }

      // Check required fields
      if (!q.text) issues.push(`Missing Field: Question #${q.id} has no 'text' field.`);
      if (!q.type) issues.push(`Missing Field: Question #${q.id} has no 'type' field.`);

      // Type specific checks
      if (q.type === 'mcq' && (!q.options || !Array.isArray(q.options))) {
        issues.push(`Invalid MCQ: Question #${q.id} is missing 'options' array.`);
      }
      if (q.type === 'match' && (!q.pairs || !Array.isArray(q.pairs))) {
        issues.push(`Invalid Match: Question #${q.id} is missing 'pairs' array.`);
      }
    });

  } catch (err) {
    issues.push(`JSON Syntax Error in beginner-questions.js: ${err.message}`);
  }
}

// 2. Audit UI HTML & CSS
console.log('\n✔ Auditing UI CSS & Demo HTML elements...');
if (fs.existsSync(stylesFile)) {
  const css = fs.readFileSync(stylesFile, 'utf8');
  if (!css.includes('.side-nav-btn')) warnings.push('CSS Warning: .side-nav-btn class not found in beginner-styles.css');
  if (!css.includes('.match-cols')) warnings.push('CSS Warning: .match-cols class not found in beginner-styles.css');
  console.log('   ↳ beginner-styles.css structure verified.');
}

if (fs.existsSync(htmlFile)) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  if (!html.includes('id="btn-next-side"')) issues.push('HTML Error: #btn-next-side element missing in beginner-demo.html');
  if (!html.includes('id="interaction-area"')) issues.push('HTML Error: #interaction-area element missing in beginner-demo.html');
  console.log('   ↳ beginner-demo.html elements verified.');
}

// 3. Final Report
console.log('\n====================================================');
console.log('📊 AUDIT SUMMARY REPORT');
console.log('====================================================');

if (issues.length === 0 && warnings.length === 0) {
  console.log('🎉 ALL CHECKS PASSED PERFECTLY! No missing files, encoding errors, or UI defects found.');
} else {
  if (issues.length > 0) {
    console.log(`\n❌ FOUND ${issues.length} ISSUE(S):`);
    issues.forEach(iss => console.log(`   - ${iss}`));
  }
  if (warnings.length > 0) {
    console.log(`\n⚠️ ${warnings.length} WARNING(S):`);
    warnings.forEach(w => console.log(`   - ${w}`));
  }
}
console.log('\n====================================================\n');
