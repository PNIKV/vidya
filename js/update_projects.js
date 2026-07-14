const fs = require('node:fs');
const path = require('node:path');

// ═══════════════════════════════════════════════════════════════
//  VIDYA Project Compiler — Version 2
//  
//  This script:
//  1. Auto-discovers ALL project folders under projects/Level-*/
//  2. Scans each folder recursively for files (images, code, 3D, etc.)
//  3. Strips auto-generated fields from source JSON (keeps it clean)
//  4. Outputs a single compiled_projects.json for the frontend
//  5. Auto-updates projects/projects.json index
//
//  Usage:  node js/update_projects.js
//  Test:   node js/update_projects.js --test
// ═══════════════════════════════════════════════════════════════

const rootDir = path.join(__dirname, '..');
const projectsDir = path.join(rootDir, 'projects');
const isTestMode = process.argv.includes('--test');

// File extensions grouped by category
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mkv', '.mov']);
const CODE_EXTS = new Set(['.ino', '.cpp', '.h', '.c', '.py', '.md']);
const MODEL_EXTS = new Set(['.stl', '.obj']);
const PDF_EXTS = new Set(['.pdf']);
const FW_EXTS = new Set(['.bin', '.hex']);

// Fields that are auto-generated — NEVER stored in source JSON
const AUTO_FIELDS = [
  'gallery', 'posters', 'presentationPdfs', 'files3d',
  'codeFiles', 'firmware', 'bannerImages', 'dataVideos',
  'image', 'bannerImage', 'bannerImage2',
  'poster', 'researchPaper', 'icon'
];

// ── Step 1: Auto-discover all project folders ──────────────────
function discoverProjects() {
  const projects = [];
  const projectDirs = fs.readdirSync(projectsDir).filter(d => {
    if (d === 'datafolder') return false;
    const full = path.join(projectsDir, d);
    if (!fs.statSync(full).isDirectory()) return false;
    // Must have a matching JSON file inside
    const jsonPath = path.join(full, d + '.json');
    return fs.existsSync(jsonPath);
  });

  for (const projDir of projectDirs) {
    const jsonFile = projDir + '.json';
    const relPath = path.posix.join('projects', projDir, jsonFile);
    const absJsonPath = path.join(projectsDir, projDir, jsonFile);
    const absDirPath = path.join(projectsDir, projDir);
    projects.push({ relPath, absJsonPath, absDirPath, dirName: projDir });
  }

  return projects;
}

// ── Step 2: Recursively scan a directory for ALL files ─────────
function scanDirRecursive(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanDirRecursive(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

// ── Step 3: Categorize files into auto-detected arrays ─────────
function categorizeFiles(absDirPath, relDirPath, jsonFilename) {
  const allFiles = scanDirRecursive(absDirPath);

  const result = {
    gallery: [],
    posters: [],
    presentationPdfs: [],
    files3d: [],
    codeFiles: [],
    firmware: [],
    bannerImages: [],
    dataVideos: [],
    image: null
  };

  for (const absFile of allFiles) {
    const filename = path.basename(absFile);
    const ext = path.extname(filename).toLowerCase();
    const basename = path.basename(filename, ext).toLowerCase();

    // Build relative URL from project root (using posix separators)
    const relFromRoot = path.relative(rootDir, absFile);
    const relativeUrl = relFromRoot.split(path.sep).join('/');

    // Skip the project's own JSON file and other JSON files
    if (ext === '.json') continue;

    // ── Images ──
    if (IMAGE_EXTS.has(ext)) {
      if (basename === 'icon') {
        result.image = relativeUrl;
      }

      if (basename.startsWith('banner')) {
        result.bannerImages.push(relativeUrl);
      }

      // Poster detection: poster, poster1, poster2, poster3, etc.
      let caption = basename;
      let isPoster = false;

      if (/^poster\d*$/.test(basename)) {
        isPoster = true;
        if (basename === 'poster1' || basename === 'poster') caption = 'Problem Statement';
        else if (basename === 'poster2') caption = 'Solution & Methodology';
        else if (basename === 'poster3') caption = 'Future Scope';
        else caption = `Poster ${basename.replace('poster', '')}`;
      }

      const imgObj = { file: relativeUrl, caption };
      result.gallery.push(imgObj);

      if (isPoster) {
        result.posters.push(imgObj);
      }
    }

    // ── Videos ──
    else if (VIDEO_EXTS.has(ext)) {
      result.dataVideos.push({ name: filename, url: relativeUrl, desc: 'Local Video' });
    }

    // ── PDFs ──
    else if (PDF_EXTS.has(ext)) {
      result.presentationPdfs.push({ file: relativeUrl, name: filename });
    }

    // ── 3D Models ──
    else if (MODEL_EXTS.has(ext)) {
      result.files3d.push({ name: filename, url: relativeUrl, size: ext.toUpperCase().replace('.', '') + ' Format' });
    }

    // ── Firmware ──
    else if (FW_EXTS.has(ext)) {
      result.firmware.push({ name: filename, url: relativeUrl });
    }

    // ── Code Files ──
    else if (CODE_EXTS.has(ext)) {
      let lang = ext.replace('.', '').toUpperCase();
      if (ext === '.ino') lang = 'Arduino C++';
      if (ext === '.md') lang = 'Markdown';
      if (ext === '.py') lang = 'Python';
      if (ext === '.c') lang = 'C';
      if (ext === '.cpp') lang = 'C++';
      if (ext === '.h') lang = 'C/C++ Header';

      result.codeFiles.push({ name: filename, url: relativeUrl, language: lang });
    }
  }

  // Sort arrays for consistent output
  result.bannerImages.sort();
  result.posters.sort((a, b) => a.file.localeCompare(b.file));
  result.gallery.sort((a, b) => a.file.localeCompare(b.file));
  result.codeFiles.sort((a, b) => a.name.localeCompare(b.name));
  result.files3d.sort((a, b) => a.name.localeCompare(b.name));

  return result;
}

// ── Main ───────────────────────────────────────────────────────
const discoveredProjects = discoverProjects();
console.log(`\n🔍 Discovered ${discoveredProjects.length} project(s)\n`);

const compiledProjects = [];
const projectPaths = [];
const errors = [];

for (const proj of discoveredProjects) {
  try {
    const sourceData = JSON.parse(fs.readFileSync(proj.absJsonPath, 'utf8'));

    // ── Clean the source JSON: remove all auto-generated fields ──
    const cleanData = { ...sourceData };
    for (const field of AUTO_FIELDS) {
      delete cleanData[field];
    }

    // Legacy migrations
    if (cleanData.skills) {
      cleanData.guide = cleanData.skills.map(s => `Learn and apply ${s.toLowerCase()}`);
      delete cleanData.skills;
    }
    if (cleanData.icon) delete cleanData.icon;

    // Write clean source JSON back
    fs.writeFileSync(proj.absJsonPath, JSON.stringify(cleanData, null, 2) + '\n');
    console.log(`  ✅ Cleaned  ${proj.dirName}/${path.basename(proj.absJsonPath)}`);

    // ── Build compiled data ──
    const relDirPath = path.posix.join('projects', path.relative(projectsDir, proj.absDirPath).split(path.sep).join('/'));
    const detected = categorizeFiles(proj.absDirPath, relDirPath, path.basename(proj.absJsonPath));

    const compiled = { ...cleanData };

    // Merge detected files
    if (detected.image) compiled.image = detected.image;
    if (!compiled.image) compiled.image = `projects/images/${compiled.id || 'default'}.jpg`;

    if (detected.gallery.length > 0) compiled.gallery = detected.gallery;
    if (detected.posters.length > 0) compiled.posters = detected.posters;
    if (detected.presentationPdfs.length > 0) compiled.presentationPdfs = detected.presentationPdfs;
    if (detected.files3d.length > 0) compiled.files3d = detected.files3d;
    if (detected.codeFiles.length > 0) compiled.codeFiles = detected.codeFiles;
    if (detected.firmware.length > 0) compiled.firmware = detected.firmware;
    if (detected.bannerImages.length > 0) compiled.bannerImages = detected.bannerImages;
    if (detected.dataVideos.length > 0) compiled.dataVideos = detected.dataVideos;

    compiledProjects.push(compiled);
    projectPaths.push(proj.relPath);

    // Log detected counts
    const counts = [
      detected.gallery.length && `${detected.gallery.length} images`,
      detected.posters.length && `${detected.posters.length} posters`,
      detected.codeFiles.length && `${detected.codeFiles.length} code`,
      detected.files3d.length && `${detected.files3d.length} 3D`,
      detected.firmware.length && `${detected.firmware.length} firmware`,
      detected.presentationPdfs.length && `${detected.presentationPdfs.length} PDFs`,
      detected.bannerImages.length && `${detected.bannerImages.length} banners`,
      detected.dataVideos.length && `${detected.dataVideos.length} videos`,
    ].filter(Boolean);

    if (counts.length > 0) {
      console.log(`         Found: ${counts.join(', ')}`);
    } else {
      console.log(`         Found: (no resource files detected)`);
    }

  } catch (err) {
    const msg = `❌ ERROR processing ${proj.dirName}: ${err.message}`;
    console.error(`  ${msg}`);
    errors.push(msg);
  }
}

// ── Write compiled output ──
const datafolderPath = path.join(projectsDir, 'datafolder');
if (!fs.existsSync(datafolderPath)) {
  fs.mkdirSync(datafolderPath, { recursive: true });
}

const outputPath = path.join(datafolderPath, 'compiled_projects.json');
fs.writeFileSync(outputPath, JSON.stringify(compiledProjects, null, 2) + '\n');
console.log(`\n📦 Wrote ${compiledProjects.length} projects → projects/datafolder/compiled_projects.json`);

// ══════════════════════════════════════════════════════════════
//  TEST MODE: Validate compiled output
// ══════════════════════════════════════════════════════════════
if (isTestMode) {
  console.log('\n' + '═'.repeat(60));
  console.log('  🧪 RUNNING TESTS');
  console.log('═'.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  function test(name, condition) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // Test 1: Compiled file exists and is valid JSON
  const compiledRaw = fs.readFileSync(outputPath, 'utf8');
  let compiledData;
  try {
    compiledData = JSON.parse(compiledRaw);
    test('compiled_projects.json is valid JSON', true);
  } catch (e) {
    test('compiled_projects.json is valid JSON', false);
  }

  // Test 2: It's an array
  test('Compiled output is an array', Array.isArray(compiledData));

  // Test 3: Has projects
  test(`Found ${compiledData.length} projects (> 0)`, compiledData.length > 0);

  // Test 4: Every project has required fields
  for (const p of compiledData) {
    test(`Project "${p.id || p.title || '???'}" has id`, !!p.id);
    test(`Project "${p.id}" has title`, !!p.title);
    test(`Project "${p.id}" has image`, !!p.image);
  }

  // Test 5: Source JSONs have NO auto-generated fields
  for (const proj of discoveredProjects) {
    const src = JSON.parse(fs.readFileSync(proj.absJsonPath, 'utf8'));
    const hasAutoField = AUTO_FIELDS.some(f => src[f] !== undefined);
    test(`Source ${proj.dirName}.json has no auto-fields`, !hasAutoField);
  }

  // Test 6: Check that files referenced in compiled output actually exist
  for (const p of compiledData) {
    if (p.gallery) {
      for (const img of p.gallery) {
        const absPath = path.join(rootDir, img.file);
        test(`Gallery file exists: ${img.file}`, fs.existsSync(absPath));
      }
    }
    if (p.codeFiles) {
      for (const c of p.codeFiles) {
        const absPath = path.join(rootDir, c.url);
        test(`Code file exists: ${c.url}`, fs.existsSync(absPath));
      }
    }
    if (p.files3d) {
      for (const f of p.files3d) {
        const absPath = path.join(rootDir, f.url);
        test(`3D file exists: ${f.url}`, fs.existsSync(absPath));
      }
    }
    if (p.firmware) {
      for (const fw of p.firmware) {
        const absPath = path.join(rootDir, fw.url);
        test(`Firmware file exists: ${fw.url}`, fs.existsSync(absPath));
      }
    }
    if (p.bannerImages) {
      for (const b of p.bannerImages) {
        const absPath = path.join(rootDir, b);
        test(`Banner file exists: ${b}`, fs.existsSync(absPath));
      }
    }
  }

  // Test 7: No build errors
  test('No build errors occurred', errors.length === 0);

  console.log('\n' + '─'.repeat(60));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('─'.repeat(60) + '\n');

  if (failed > 0) process.exit(1);
}
