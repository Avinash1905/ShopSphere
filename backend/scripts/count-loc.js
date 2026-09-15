const fs = require('fs');
const path = require('path');

function countFileLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  let totalLines = lines.length;
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blankLines++;
      continue;
    }
    if (inBlockComment) {
      commentLines++;
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }
    if (trimmed.startsWith('/*')) {
      commentLines++;
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      continue;
    }
    if (trimmed.startsWith('//')) {
      commentLines++;
      continue;
    }
    codeLines++;
  }

  return { totalLines, codeLines, commentLines, blankLines };
}

function scanDir(dirPath, filterExt = ['.ts', '.js']) {
  let results = [];
  if (!fs.existsSync(dirPath)) return results;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === 'coverage') {
        continue;
      }
      results = results.concat(scanDir(fullPath, filterExt));
    } else if (entry.isFile() && filterExt.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

function main() {
  const baseDir = path.resolve(__dirname, '..');
  const srcDir = path.join(baseDir, 'src');
  const testsDir = path.join(baseDir, 'tests');

  const srcFiles = scanDir(srcDir);
  const testFiles = scanDir(testsDir);

  const categories = {
    Foundation: [/src[\\/]config/, /src[\\/]core/],
    Middleware: [/src[\\/]middleware/],
    Validators: [/src[\\/]validators/],
    Repositories: [/src[\\/]repositories/],
    Services: [/src[\\/]auth[\\/]services/, /src[\\/]users[\\/]services/],
    Controllers: [/src[\\/]auth[\\/]controllers/, /src[\\/]users[\\/]controllers/],
    Auth: [/src[\\/]auth/],
    Users: [/src[\\/]users/],
  };

  const catStats = {
    Foundation: 0,
    Middleware: 0,
    Validators: 0,
    Repositories: 0,
    Services: 0,
    Controllers: 0,
    Auth: 0,
    Users: 0
  };

  let totalSrcTotalLines = 0;
  let totalSrcCodeLines = 0;

  for (const file of srcFiles) {
    const stat = countFileLines(file);
    totalSrcTotalLines += stat.totalLines;
    totalSrcCodeLines += stat.codeLines;

    for (const [cat, patterns] of Object.entries(categories)) {
      if (patterns.some(p => p.test(file))) {
        catStats[cat] += stat.totalLines;
      }
    }
  }

  let totalTestTotalLines = 0;
  let totalTestCodeLines = 0;
  for (const file of testFiles) {
    const stat = countFileLines(file);
    totalTestTotalLines += stat.totalLines;
    totalTestCodeLines += stat.codeLines;
  }

  console.log('--------------------------------------------------');
  console.log('ShopSphere Backend Phase 1 LOC Report');
  console.log('--------------------------------------------------');
  console.log(`Production Files:       ${srcFiles.length}`);
  console.log(`Test Files:             ${testFiles.length}`);
  console.log(`Total Backend Files:    ${srcFiles.length + testFiles.length}`);
  console.log('--------------------------------------------------');
  console.log(`Production Total Lines: ${totalSrcTotalLines}`);
  console.log(`Production Code Lines:  ${totalSrcCodeLines}`);
  console.log(`Test Total Lines:       ${totalTestTotalLines}`);
  console.log(`Test Code Lines:        ${totalTestCodeLines}`);
  console.log('--------------------------------------------------');
  console.log('Category Breakdown (Total Lines in src):');
  for (const [cat, lines] of Object.entries(catStats)) {
    console.log(`  ${cat.padEnd(16)}: ${lines}`);
  }
  console.log('--------------------------------------------------');
}

main();
