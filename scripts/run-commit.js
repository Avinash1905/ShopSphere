import { execSync } from 'node:child_process';
import fs from 'node:fs';

if (fs.existsSync('.git/index.lock')) {
  try {
    fs.unlinkSync('.git/index.lock');
    console.log('Removed stale .git/index.lock');
  } catch (e) {
    console.log('Could not remove lock:', e.message);
  }
}

if (fs.existsSync('scripts/package-submission.js')) {
  fs.unlinkSync('scripts/package-submission.js');
}

execSync('git add scripts/create-zip.ps1 scripts/test-extracted-zip.ps1 scripts/run-commit.js', { stdio: 'inherit' });
try {
  execSync('git commit -m "chore: add packaging and test extraction scripts"', { stdio: 'inherit' });
} catch (e) {
  console.log('Already committed or clean.');
}

const count = execSync('git rev-list --count HEAD').toString().trim();
console.log('CURRENT_COMMIT_COUNT:', count);

// Re-generate the clean ZIP
execSync('powershell -ExecutionPolicy Bypass -File scripts/create-zip.ps1', { stdio: 'inherit' });

// Re-verify the clean ZIP
execSync('powershell -ExecutionPolicy Bypass -File scripts/test-extracted-zip.ps1', { stdio: 'inherit' });
