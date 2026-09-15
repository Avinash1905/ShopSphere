/**
 * ShopSphere Precision LOC (Lines of Code) Analyzer
 * Strictly measures legitimate source code lines, comments, and blank lines.
 * Excludes package-lock.json, node_modules, .git, dist, build, caches, and binaries.
 */

import fs from 'fs';
import path from 'path';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.cache',
  'coverage',
  '.gemini',
  '.system_generated',
  '.trainplex_staging'
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'ShopSphere-TrainPlex.zip'
]);

const EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.css',
  '.scss',
  '.html',
  '.md',
  '.sql',
  '.prisma',
  '.yaml',
  '.yml'
]);

const stats = {
  totalFiles: 0,
  sourceFiles: 0,
  testFiles: 0,
  totalLines: 0,
  codeLines: 0,
  commentLines: 0,
  blankLines: 0,
  byDirectory: {},
  byExtension: {}
};

function analyzeFile(filePath) {
  const baseName = path.basename(filePath);
  if (IGNORED_FILES.has(baseName)) return;

  const ext = path.extname(filePath).toLowerCase();
  if (!EXTENSIONS.has(ext)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(process.cwd(), filePath);
  const topDir = relPath.split(path.sep)[0] || 'root';

  let code = 0;
  let comment = 0;
  let blank = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blank++;
      continue;
    }

    if (inBlockComment) {
      comment++;
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith('/*')) {
      comment++;
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      continue;
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--')) {
      comment++;
      continue;
    }

    code++;
  }

  stats.totalFiles++;
  if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('tests' + path.sep)) {
    stats.testFiles++;
  } else {
    stats.sourceFiles++;
  }

  const fileTotal = lines.length;
  stats.totalLines += fileTotal;
  stats.codeLines += code;
  stats.commentLines += comment;
  stats.blankLines += blank;

  if (!stats.byDirectory[topDir]) {
    stats.byDirectory[topDir] = { files: 0, total: 0, code: 0, comments: 0, blanks: 0 };
  }
  stats.byDirectory[topDir].files++;
  stats.byDirectory[topDir].total += fileTotal;
  stats.byDirectory[topDir].code += code;
  stats.byDirectory[topDir].comments += comment;
  stats.byDirectory[topDir].blanks += blank;

  if (!stats.byExtension[ext]) {
    stats.byExtension[ext] = { files: 0, total: 0, code: 0, comments: 0, blanks: 0 };
  }
  stats.byExtension[ext].files++;
  stats.byExtension[ext].total += fileTotal;
  stats.byExtension[ext].code += code;
  stats.byExtension[ext].comments += comment;
  stats.byExtension[ext].blanks += blank;
}

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile()) {
      analyzeFile(fullPath);
    }
  }
}

scanDir(process.cwd());

console.log('\n==================================================================');
console.log('                 SHOPSPHERE OFFICIAL LOC REPORT                   ');
console.log('==================================================================');
console.log(`Total Source Files:      ${stats.totalFiles.toLocaleString()}`);
console.log(`  - Application Files:   ${stats.sourceFiles.toLocaleString()}`);
console.log(`  - Test Files:          ${stats.testFiles.toLocaleString()}`);
console.log('------------------------------------------------------------------');
console.log(`SOURCE CODE LOC:         ${stats.codeLines.toLocaleString()}`);
console.log(`Comment Lines:           ${stats.commentLines.toLocaleString()}`);
console.log(`Blank Lines:             ${stats.blankLines.toLocaleString()}`);
console.log(`Total Physical Lines:    ${stats.totalLines.toLocaleString()}`);
console.log('==================================================================');
console.log('LOC Breakdown by Directory:');
for (const [dir, dStats] of Object.entries(stats.byDirectory)) {
  console.log(`  📁 ${dir.padEnd(16)} | Files: ${String(dStats.files).padStart(4)} | Source Code: ${dStats.code.toLocaleString().padStart(8)} | Comments: ${dStats.comments.toLocaleString().padStart(6)} | Total: ${dStats.total.toLocaleString().padStart(8)}`);
}
console.log('------------------------------------------------------------------');
console.log('LOC Breakdown by Language / Extension:');
for (const [ext, eStats] of Object.entries(stats.byExtension)) {
  console.log(`  📄 ${ext.padEnd(12)} | Files: ${String(eStats.files).padStart(4)} | Source Code: ${eStats.code.toLocaleString().padStart(8)} | Total: ${eStats.total.toLocaleString().padStart(8)}`);
}
console.log('==================================================================\n');
