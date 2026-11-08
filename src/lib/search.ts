import type { CatalogBatch } from './api';

/** Hinglish-friendly normalisation, mirroring the reference batch search. */
export function normalize(value: string): string {
  return value.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(physics|chem|maths|math)\b/g, ' ')
    .replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/kh/g, 'k')
    .replace(/bh/g, 'b').replace(/sh/g, 's').replace(/ch/g, 'c')
    .replace(/\s+/g, ' ').trim();
}

function editDistanceOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

export function scoreBatch(batch: CatalogBatch, query: string): number {
  const q = normalize(query);
  if (!q) return 0;
  const name = normalize(batch.name || '');
  const meta = normalize([batch.byName, batch.exam, batch.language, batch.class].filter(Boolean).join(' '));
  let score = 0;
  if (name === q) score += 400;
  if (name.startsWith(q)) score += 180;
  if (name.includes(q)) score += 120;
  for (const token of q.split(' ')) {
    if (!token) continue;
    if (name.includes(token)) score += 40;
    else if (name.split(' ').some((w) => w.startsWith(token))) score += 26;
    else if (name.split(' ').some((w) => editDistanceOne(w, token))) score += 14;
    if (meta.includes(token)) score += 10;
  }
  const year = q.match(/20\d{2}/)?.[0];
  if (year && (batch.name || '').includes(year)) score += 30;
  return score;
}

export function searchBatches(batches: CatalogBatch[], query: string, limit = 60): CatalogBatch[] {
  if (!query.trim()) return batches.slice(0, limit);
  return batches
    .map((b) => ({ b, s: scoreBatch(b, query) }))
    .filter((x) => x.s > 20)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.b);
}
