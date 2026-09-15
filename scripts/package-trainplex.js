/**
 * ShopSphere TrainPlex Packaging Script
 * Creates ShopSphere-TrainPlex.zip excluding node_modules, .git, dist, coverage, and caches.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const outputZip = path.join(process.cwd(), 'ShopSphere-TrainPlex.zip');
console.log('📦 Preparing ShopSphere-TrainPlex.zip archive...');

if (fs.existsSync(outputZip)) {
  fs.unlinkSync(outputZip);
}

try {
  // Use PowerShell Compress-Archive on Windows
  const excludeItems = ['node_modules', '.git', 'dist', 'coverage', '.cache', 'ShopSphere-TrainPlex.zip'];
  const tempDir = path.join(process.cwd(), '.trainplex_staging');
  
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const copyRecursive = (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (excludeItems.includes(entry.name)) continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else if (entry.isFile()) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  console.log('📂 Staging clean distribution files...');
  copyRecursive(process.cwd(), tempDir);

  console.log('🗜️ Compressing to ShopSphere-TrainPlex.zip...');
  const psCmd = `powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${outputZip}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });

  // Cleanup staging dir
  fs.rmSync(tempDir, { recursive: true, force: true });

  if (fs.existsSync(outputZip)) {
    const stats = fs.statSync(outputZip);
    console.log(`✅ ShopSphere-TrainPlex.zip created successfully! (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  }
} catch (error) {
  console.error('❌ Failed to create zip package:', error.message);
  process.exit(1);
}
