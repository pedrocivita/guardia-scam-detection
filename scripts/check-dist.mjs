import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const needles = ['AIza', 'GEMINI_API_KEY', 'generativelanguage.googleapis.com', 'process.env.API_KEY'];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const dist = path.resolve('dist');
const files = await walk(dist);
let failed = false;

for (const file of files) {
  const text = (await readFile(file)).toString('utf8');
  for (const needle of needles) {
    if (text.includes(needle)) {
      console.error(`Forbidden string (${needle}) in ${path.relative(dist, file)}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`dist is clean (${files.length} files, no Gemini key material)`);
