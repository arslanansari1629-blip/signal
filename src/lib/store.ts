import { useSyncExternalStore } from 'react';
import type { CatalogBatch } from './api';

const FAV = 'aryavidya_favorites_v1';
const HIST = 'aryavidya_history_v1';
const THEME = 'aryavidya_theme';
const PDFS = 'aryavidya_pdfs_v1';

export interface Favorite { batch_id: string; name: string; photo?: string; exam?: string; language?: string }
export interface HistoryEntry extends Favorite { visitedAt: number; path: string }
export interface SavedPdf { name: string; url: string; context: string; savedAt: number }

function read<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

let favorites: Favorite[] = read<Favorite[]>(FAV, []);
let history: HistoryEntry[] = read<HistoryEntry[]>(HIST, []);
let theme: string = localStorage.getItem(THEME) || 'light';
let pdfs: SavedPdf[] = read<SavedPdf[]>(PDFS, []);

function persist() {
  try {
    localStorage.setItem(FAV, JSON.stringify(favorites));
    localStorage.setItem(HIST, JSON.stringify(history.slice(0, 60)));
    localStorage.setItem(THEME, theme);
    localStorage.setItem(PDFS, JSON.stringify(pdfs.slice(0, 100)));
  } catch { /* storage full or unavailable */ }
  emit();
}

export const store = {
  isFavorite: (id: string) => favorites.some((f) => f.batch_id === id),
  toggleFavorite(batch: CatalogBatch | Favorite) {
    const id = batch.batch_id;
    favorites = favorites.some((f) => f.batch_id === id)
      ? favorites.filter((f) => f.batch_id !== id)
      : [{ batch_id: id, name: batch.name, photo: (batch as CatalogBatch).photo, exam: String((batch as CatalogBatch).exam ?? ''), language: batch.language }, ...favorites];
    persist();
  },
  visit(entry: Omit<HistoryEntry, 'visitedAt'>) {
    history = [{ ...entry, visitedAt: Date.now() }, ...history.filter((h) => h.path !== entry.path)].slice(0, 60);
    persist();
  },
  clearHistory() { history = []; persist(); },
  savePdf(entry: Omit<SavedPdf, 'savedAt'>) {
    pdfs = [{ ...entry, savedAt: Date.now() }, ...pdfs.filter((p) => p.url !== entry.url)].slice(0, 100);
    persist();
  },
  removePdf(url: string) { pdfs = pdfs.filter((p) => p.url !== url); persist(); },
  clearPdfs() { pdfs = []; persist(); },
  setTheme(next: string) { theme = next; document.documentElement.dataset.theme = next; persist(); }
};

export const useFavorites = () => useSyncExternalStore(subscribe, () => favorites, () => favorites);
export const useHistory = () => useSyncExternalStore(subscribe, () => history, () => history);
export const useDownloads = () => useSyncExternalStore(subscribe, () => pdfs, () => pdfs);
export const useTheme = () => useSyncExternalStore(subscribe, () => theme, () => theme);
export const applyTheme = () => { document.documentElement.dataset.theme = theme; };
