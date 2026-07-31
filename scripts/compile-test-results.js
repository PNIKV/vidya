const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const testsDir = path.join(rootDir, 'assessment', 'data', 'tests');
const outputFile = path.join(rootDir, 'assessment', 'data', 'leaderboard-data.json');
const questionsFile = path.join(rootDir, 'assessment', 'beginner-questions.js');

// Load Questions Meta
let questionsMap = new Map();
if (fs.existsSync(questionsFile)) {
  const code = fs.readFileSync(questionsFile, 'utf8');
  const window = {};
  try {
    eval(code);
    if (Array.isArray(window.BEGINNER_QUESTIONS)) {
      window.BEGINNER_QUESTIONS.forEach(q => {
        questionsMap.set(Number(q.id), {
          id: Number(q.id),
          type: q.type || 'mcq',
          marks: Number(q.marks || 1)
        });
      });
    }
  } catch (err) {
    console.warn('Could not parse beginner-questions.js:', err.message);
  }
}

// Simple CSV Line Parser handling quotes
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

// Extract date from filename or stat birthtime/mtime
function extractDate(filename, filePath) {
  const match = filename.match(/(\d{1,2})[-_](\d{1,2})[-_](\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  const stat = fs.statSync(filePath);
  const d = stat.mtime || stat.birthtime || new Date();
  return d.toISOString().split('T')[0];
}

function parseCSVFile(filePath) {
  const filename = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return null;

  const header = lines[0];
  const dateStr = extractDate(filename, filePath);

  // Format 2: Single-row wide format (Name,Grade,School/College,Q1...Q50,Total Score,Percentage)
  if (header.includes('School/College') || (header.startsWith('Name') && header.includes('Q1'))) {
    const dataLine = lines[1];
    if (!dataLine) return null;
    const cols = parseCSVLine(dataLine);

    const name = cols[0] || 'Unknown';
    const grade = cols[1] || 'Unspecified';
    const school = cols[2] || 'Unspecified';

    const categoryScores = {
      mcq: 0,
      true_false: 0,
      match: 0,
      fill_bank: 0,
      calc: 0,
      arduino_ide: 0,
      audio_id: 0,
      picto: 0,
      ai_question: 0,
      image_id: 0
    };

    let calculatedTotal = 0;
    let calculatedMax = 0;

    for (let qNum = 1; qNum <= 50; qNum++) {
      const qMeta = questionsMap.get(qNum) || { type: 'mcq', marks: 1 };
      calculatedMax += qMeta.marks;

      const cellVal = cols[qNum + 2] !== undefined ? cols[qNum + 2] : '0';
      let earned = 0;

      if (!isNaN(cellVal) && cellVal.trim() !== '') {
        earned = parseFloat(cellVal);
      } else if (cellVal.toLowerCase() === 'true' || cellVal.toLowerCase() === 'yes') {
        earned = qMeta.marks;
      } else if (cellVal.toLowerCase() === 'false' || cellVal.toLowerCase() === 'no') {
        earned = 0;
      } else {
        earned = cellVal.length > 0 ? 1 : 0;
      }

      if (categoryScores[qMeta.type] !== undefined) {
        categoryScores[qMeta.type] += earned;
      } else {
        categoryScores.mcq += earned;
      }
      calculatedTotal += earned;
    }

    const fileTotal = cols[53] ? parseFloat(cols[53]) : calculatedTotal;
    const filePct = cols[54] ? parseFloat(cols[54].replace('%', '')) : Math.round((fileTotal / (calculatedMax || 100)) * 100);

    return {
      filename,
      date: dateStr,
      name,
      grade,
      school,
      categoryScores,
      totalScore: fileTotal,
      maxScore: calculatedMax || 100,
      percentage: filePct
    };
  }

  // Format 1 & 3: Multi-row detailed format (Student Name,Grade,School,Q#,Type...)
  let name = '';
  let grade = '';
  let school = '';
  let fileTotal = null;
  let fileMax = null;
  let filePct = null;

  const categoryScores = {
    mcq: 0,
    true_false: 0,
    match: 0,
    fill_bank: 0,
    calc: 0,
    arduino_ide: 0,
    audio_id: 0,
    picto: 0,
    ai_question: 0,
    image_id: 0
  };

  let calculatedTotal = 0;
  let calculatedMax = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < 3) continue;

    if (row[0] && row[0] !== 'TOTAL' && row[0] !== '') {
      name = row[0];
    }
    if (row[1] && row[1] !== '-' && row[1] !== '') {
      grade = row[1];
    }
    if (row[2] && row[2] !== '-' && row[2] !== '') {
      school = row[2];
    }

    if (row[3] === 'TOTAL' || row[0] === 'TOTAL') {
      const earnedIdx = row.length - 2;
      const maxIdx = row.length - 1;
      if (!isNaN(row[earnedIdx])) fileTotal = parseFloat(row[earnedIdx]);
      if (!isNaN(row[maxIdx])) fileMax = parseFloat(row[maxIdx]);
      continue;
    }

    if (row.join(',').includes('Score %')) {
      const pctCell = row.find(c => c.includes('%'));
      if (pctCell) {
        filePct = parseFloat(pctCell.replace('%', ''));
      }
      continue;
    }

    const qType = (row[4] || row[5] || 'mcq').toLowerCase().trim();
    const earned = parseFloat(row[7] || row[6] || '0') || 0;
    const maxMarks = parseFloat(row[8] || row[7] || '1') || 1;

    calculatedTotal += earned;
    calculatedMax += maxMarks;

    const normType = categoryScores[qType] !== undefined ? qType : (categoryScores[qType.replace('_', '')] !== undefined ? qType.replace('_', '') : 'mcq');
    categoryScores[normType] += earned;
  }

  const finalTotal = fileTotal !== null ? fileTotal : calculatedTotal;
  const finalMax = fileMax !== null ? fileMax : (calculatedMax || 100);
  const finalPct = (filePct !== null && !isNaN(filePct)) ? filePct : Math.round((finalTotal / (finalMax || 1)) * 100);

  return {
    filename,
    date: dateStr,
    name: name || 'Unknown Student',
    grade: grade || 'Unspecified',
    school: school || 'Unspecified',
    categoryScores,
    totalScore: finalTotal,
    maxScore: finalMax,
    percentage: finalPct
  };
}

function runCompiler() {
  console.log('🚀 STEM Quest Test Data Compiler');
  console.log('Scanning directory:', testsDir);

  if (!fs.existsSync(testsDir)) {
    console.error('Error: Tests directory does not exist at:', testsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(testsDir).filter(f => f.toLowerCase().endsWith('.csv'));
  console.log(`Found ${files.length} student test CSV files.`);

  const records = [];
  files.forEach(file => {
    try {
      const parsed = parseCSVFile(path.join(testsDir, file));
      if (parsed) {
        records.push(parsed);
      }
    } catch (err) {
      console.warn(`Failed to parse file ${file}:`, err.message);
    }
  });

  // Sort records chronologically (older first, newer below)
  records.sort((a, b) => new Date(a.date) - new Date(b.date));

  fs.writeFileSync(outputFile, JSON.stringify(records, null, 2), 'utf8');
  console.log(`\n🎉 Successfully compiled ${records.length} student records into:`);
  console.log(`   ${outputFile}`);
}

runCompiler();
