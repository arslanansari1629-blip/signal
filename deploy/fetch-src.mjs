/**
 * Vercel build bootstrap.
 *
 * The Vercel account has no GitHub integration installed, so the project cannot be
 * linked to the repository directly. Instead this script pulls the exact branch
 * tarball from codeload.github.com at install time and places the real source tree
 * in the build workspace. `npm run build` then runs the app's own build unchanged.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO = process.env.SOURCE_REPO || 'arslanansari1629-blip/signal';
// Pinned for reproducible builds; override with SOURCE_REF (branch or commit).
const REF = process.env.SOURCE_REF || '0f8e288fcbc4688e8eae83f61895fcc13cc3a7cb';
const ENTRIES = ['src', 'api', 'server', 'public', 'index.html', 'vite.config.ts', 'tsconfig.json'];

const ref = REF.includes('/') && !REF.startsWith('refs/') ? `refs/heads/${REF}` : REF;
const url = `https://codeload.github.com/${REPO}/tar.gz/${ref}`;
console.log(`[bootstrap] fetching ${url}`);
const work = mkdtempSync(join(tmpdir(), 'signal-src-'));
const archive = join(work, 'source.tgz');

try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  writeFileSync(archive, Buffer.from(await res.arrayBuffer()));
} catch (err) {
  // Some build/CI environments intercept TLS; curl uses the system trust store.
  console.log(`[bootstrap] fetch failed (${err.message}); retrying with curl`);
  execFileSync('curl', ['-fsSL', '--retry', '3', url, '-o', archive], { stdio: 'inherit' });
}
execFileSync('tar', ['-xzf', archive, '-C', work], { stdio: 'inherit' });

const root = readdirSync(work, { withFileTypes: true }).find((e) => e.isDirectory())?.name;
if (!root) throw new Error('Source archive did not contain a project directory');

for (const entry of ENTRIES) {
  const from = join(work, root, entry);
  if (!existsSync(from)) continue;
  cpSync(from, join(process.cwd(), entry), { recursive: true });
  console.log(`[bootstrap] restored ${entry}`);
}
if (!existsSync(join(process.cwd(), 'src', 'main.tsx'))) throw new Error('Source restore incomplete: src/main.tsx missing');
console.log('[bootstrap] source ready');
