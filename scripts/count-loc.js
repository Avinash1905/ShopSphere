/**
 * ShopSphere Recursive LOC (Lines of Code) Analyzer
 * Recursively scans all source files, configurations, schemas, and documentation
 * to calculate code lines, blank lines, comments, and total lines by directory and file type.
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
  '.system_generated'
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
  '.yml',
  '.env'
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
  const ext = path.extname(filePath).toLowerCase();
  if (!EXTENSIONS.has(ext) && !path.basename(filePath).startsWith('.')) return;

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

  if (!stats.byExtension[ext || 'no-ext']) {
    stats.byExtension[ext || 'no-ext'] = { files: 0, total: 0, code: 0 };
  }
  stats.byExtension[ext || 'no-ext'].files++;
  stats.byExtension[ext || 'no-ext'].total += fileTotal;
  stats.byExtension[ext || 'no-ext'].code += code;
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

console.log('🔍 Recursively analyzing ShopSphere codebase LOC...');
scanDir(process.cwd());

console.log('\n======================================================');
console.log('         SHOPSPHERE RECURSIVE LOC REPORT              ');
console.log('======================================================');
console.log(`Total Files:         ${stats.totalFiles.toLocaleString()}`);
console.log(`  - Source Files:    ${stats.sourceFiles.toLocaleString()}`);
console.log(`  - Test Files:      ${stats.testFiles.toLocaleString()}`);
console.log('------------------------------------------------------');
console.log(`Total Lines (LOC):   ${stats.totalLines.toLocaleString()}`);
console.log(`  - Actual Code:     ${stats.codeLines.toLocaleString()}`);
console.log(`  - Comments:        ${stats.commentLines.toLocaleString()}`);
console.log(`  - Blank Lines:     ${stats.blankLines.toLocaleString()}`);
console.log('======================================================');
console.log('Breakdown by Top-Level Directory:');
for (const [dir, dStats] of Object.entries(stats.byDirectory)) {
  console.log(`  📁 ${dir.padEnd(20)} | Files: ${String(dStats.files).padStart(4)} | Total Lines: ${dStats.total.toLocaleString().padStart(8)} | Code: ${dStats.code.toLocaleString().padStart(8)}`);
}
console.log('------------------------------------------------------');
console.log('Breakdown by Extension:');
for (const [ext, eStats] of Object.entries(stats.byExtension)) {
  console.log(`  📄 ${ext.padEnd(12)} | Files: ${String(eStats.files).padStart(4)} | Total Lines: ${eStats.total.toLocaleString().padStart(8)}`);
}
console.log('======================================================\n');
