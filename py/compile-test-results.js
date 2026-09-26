const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const rootDir = path.resolve(__dirname, '..');
const testsDir = path.join(rootDir, 'assessment', 'data', 'tests');
const outputFile = path.join(rootDir, 'assessment', 'data', 'leaderboard-data.json');
const questionsFile = path.join(rootDir, 'assessment', 'beginner-questions.js');

// Load Questions Meta
const questionsMap = new Map();
if (fs.existsSync(questionsFile)) {
  const code = fs.readFileSync(questionsFile, 'utf8');
  const sandbox = { window: {} };
  try {
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { timeout: 1000 });
    if (Array.isArray(sandbox.window?.BEGINNER_QUESTIONS)) {
      sandbox.window.BEGINNER_QUESTIONS.forEach(q => {
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
  for (const char of line) {
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

function createCategoryScores() {
  return {
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
}

function parseWideFormatCSV(filename, filePath, lines, dateStr) {
  const header = lines[0];
  const headers = parseCSVLine(header);

  // Find column indices based on header names (with length guard to prevent matching question text)
  const nameIdx = headers.findIndex(h => {
    const lh = h.toLowerCase().trim();
    return (lh.includes('name') || lh.includes('student')) && lh.length < 25;
  });
  const gradeIdx = headers.findIndex(h => {
    const lh = h.toLowerCase().trim();
    return lh.includes('grade') && lh.length < 20;
  });
  const schoolIdx = headers.findIndex(h => {
    const lh = h.toLowerCase().trim();
    return (lh.includes('school') || lh.includes('college')) && lh.length < 30;
  });
  const q1Idx = headers.findIndex(h => {
    const lh = h.toLowerCase().trim();
    return lh.startsWith('q1:') || lh.startsWith('q1 ') || lh === 'q1';
  });
  const totalIdx = headers.findIndex(h => {
    const lh = h.toLowerCase().trim();
    return (lh.includes('total score') || lh.includes('total') || lh.includes('score') || lh.includes('points')) && lh.length < 20;
  });
  const pctIdx = headers.findIndex(h => {
    const lh = h.toLowerCase().trim();
    return (lh.includes('percentage') || lh.includes('%') || lh.includes('pct')) && lh.length < 20;
  });

  // Fallbacks if not found
  const finalNameIdx = nameIdx !== -1 ? nameIdx : 1;
  const finalGradeIdx = gradeIdx !== -1 ? gradeIdx : 2;
  const finalSchoolIdx = schoolIdx !== -1 ? schoolIdx : 3;
  const finalQ1Idx = q1Idx !== -1 ? q1Idx : 4;
  const finalTotalIdx = totalIdx !== -1 ? totalIdx : (finalQ1Idx + 50);
  const finalPctIdx = pctIdx !== -1 ? pctIdx : (finalTotalIdx + 1);

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length <= Math.max(finalNameIdx, finalGradeIdx, finalSchoolIdx)) {
      continue;
    }

    const firstVal = cols[0] ? cols[0].trim().toLowerCase() : '';
    const nameVal = cols[finalNameIdx] ? cols[finalNameIdx].trim() : '';

    // Skip header, Max Marks, or Summary/Benchmark rows
    if (!nameVal || 
        nameVal.toLowerCase().includes('benchmark') || 
        nameVal.toLowerCase().includes('max marks') || 
        nameVal.toLowerCase().includes('summary') || 
        nameVal.toLowerCase().includes('class average') ||
        firstVal.includes('summary') || 
        firstVal.includes('total') || 
        firstVal.includes('timestamp') || 
        firstVal.includes('max marks') ||
        cols.join(',').toLowerCase().includes('max marks per question')
    ) {
      continue;
    }

    const name = nameVal || 'Unknown';
    const grade = cols[finalGradeIdx] || 'Unspecified';
    const school = cols[finalSchoolIdx] || 'Unspecified';

    const categoryScores = createCategoryScores();
    let calculatedTotal = 0;
    let calculatedMax = 0;

    for (let qNum = 1; qNum <= 50; qNum++) {
      const qMeta = questionsMap.get(qNum) || { type: 'mcq', marks: 1 };
      calculatedMax += qMeta.marks;

      const colIndex = finalQ1Idx + qNum - 1;
      const cellVal = cols[colIndex] !== undefined ? cols[colIndex] : '0';
      let earned = 0;

      const trimmed = cellVal.trim();
      if (trimmed !== '' && !Number.isNaN(Number(trimmed))) {
        earned = Number.parseFloat(trimmed);
      } else if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'yes') {
        earned = qMeta.marks;
      } else if (trimmed.toLowerCase() === 'false' || trimmed.toLowerCase() === 'no') {
        earned = 0;
      } else {
        earned = trimmed.length > 0 ? 1 : 0;
      }

      if (categoryScores[qMeta.type] !== undefined) {
        categoryScores[qMeta.type] += earned;
      } else {
        categoryScores.mcq += earned;
      }
      calculatedTotal += earned;
    }

    const fileTotal = cols[finalTotalIdx] ? Number.parseFloat(cols[finalTotalIdx]) : calculatedTotal;
    const filePct = cols[finalPctIdx] ? Number.parseFloat(cols[finalPctIdx].replace('%', '')) : Math.round((fileTotal / (calculatedMax || 100)) * 100);

    records.push({
      filename,
      date: dateStr,
      name,
      grade,
      school,
      categoryScores,
      totalScore: fileTotal,
      maxScore: calculatedMax || 100,
      percentage: filePct
    });
  }

  return records;
}

function parseMultiRowCSV(filename, filePath, lines, dateStr) {
  let name = '';
  let grade = '';
  let school = '';
  let fileTotal = null;
  let fileMax = null;
  let filePct = null;

  const categoryScores = createCategoryScores();
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
      const earnedVal = Number.parseFloat(row[earnedIdx]);
      const maxVal = Number.parseFloat(row[maxIdx]);
      if (!Number.isNaN(earnedVal)) fileTotal = earnedVal;
      if (!Number.isNaN(maxVal)) fileMax = maxVal;
      continue;
    }

    if (row.join(',').includes('Score %')) {
      const pctCell = row.find(c => c.includes('%'));
      if (pctCell) {
        filePct = Number.parseFloat(pctCell.replace('%', ''));
      }
      continue;
    }

    const qType = (row[4] || row[5] || 'mcq').toLowerCase().trim();
    const earned = Number.parseFloat(row[7] || row[6] || '0') || 0;
    const maxMarks = Number.parseFloat(row[8] || row[7] || '1') || 1;

    calculatedTotal += earned;
    calculatedMax += maxMarks;

    let normType = 'mcq';
    if (categoryScores[qType] !== undefined) {
      normType = qType;
    } else {
      const altType = qType.replace('_', '');
      if (categoryScores[altType] !== undefined) {
        normType = altType;
      }
    }
    categoryScores[normType] += earned;
  }

  const finalTotal = fileTotal !== null ? fileTotal : calculatedTotal;
  const finalMax = fileMax !== null ? fileMax : (calculatedMax || 100);
  const finalPct = (filePct !== null && !Number.isNaN(filePct)) ? filePct : Math.round((finalTotal / (finalMax || 1)) * 100);

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

function parseCSVFile(filePath) {
  const filename = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = lines[0];
  const dateStr = extractDate(filename, filePath);

  if (header.includes('School/College') || (header.startsWith('Name') && header.includes('Q1'))) {
    return parseWideFormatCSV(filename, filePath, lines, dateStr);
  }

  const multiRecord = parseMultiRowCSV(filename, filePath, lines, dateStr);
  return multiRecord ? [multiRecord] : [];
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
      if (Array.isArray(parsed)) {
        records.push(...parsed);
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
