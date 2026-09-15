import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (args[0] === '--copy') {
  const src = args[1];
  const dest = args[2];
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
} else if (args[0] === '--b64') {
  const dest = args[1];
  const b64 = args[2];
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(b64, 'base64').toString('utf8'));
  console.log(`Wrote ${dest}`);
} else {
  const dest = args[0];
  const b64 = args[1];
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(b64, 'base64').toString('utf8'));
  console.log(`Wrote ${dest}`);
}