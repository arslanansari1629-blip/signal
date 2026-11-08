import { api, type Catalog, type CatalogBatch } from './api';
import { useAsync } from './useAsync';

let memory: Catalog | null = null;
const KEY = 'aryavidya_catalog_v1';
const MAX_AGE = 10 * 60 * 1000;

function cached(): Catalog | null {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: Catalog };
    if (Date.now() - parsed.at < MAX_AGE) { memory = parsed.data; return memory; }
  } catch { /* ignore */ }
  return null;
}

export function useCatalog() {
  const state = useAsync<Catalog>(async (signal) => {
    const hit = cached();
    if (hit) return hit;
    const data = await api.catalog(signal);
    memory = data;
    try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data })); } catch { /* quota */ }
    return data;
  }, []);
  return { ...state, batches: state.data?.batches ?? [] };
}

export function randomBatches(batches: CatalogBatch[], count: number, seed: number): CatalogBatch[] {
  if (batches.length <= count) return batches;
  const out: CatalogBatch[] = [];
  const used = new Set<number>();
  let s = seed || 1;
  while (out.length < count) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const i = s % batches.length;
    if (used.has(i)) continue;
    used.add(i);
    out.push(batches[i]);
  }
  return out;
}

export const examOf = (b: CatalogBatch) => (Array.isArray(b.exam) ? b.exam[0] : b.exam) || '';
