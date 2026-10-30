import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['node_modules', 'dist', 'api', '.git', 'scripts']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

test('client sources do not embed a Gemini key or the GenAI SDK', () => {
  const files = walk(root).filter((file) => /\.(tsx?|jsx?|html|css)$/.test(file));
  assert.ok(files.some((file) => file.endsWith('vite.config.ts')));
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const relative = path.relative(root, file);
    assert.equal(text.includes('AIza'), false, relative);
    assert.equal(text.includes('process.env.API_KEY'), false, relative);
    assert.equal(text.includes('process.env.GEMINI_API_KEY'), false, relative);
    assert.equal(text.includes('import.meta.env'), false, relative);
    assert.equal(text.includes('@google/genai'), false, relative);
    assert.equal(text.includes('generativelanguage.googleapis.com'), false, relative);
  }
});

test('vite config does not define client env replacements', () => {
  const vite = readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
  assert.equal(/define\s*:/.test(vite), false);
});

test('package.json does not ship the GenAI SDK to the client', () => {
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  assert.equal(names.includes('@google/genai'), false);
});
