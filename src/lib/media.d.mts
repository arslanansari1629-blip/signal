export type WatchTarget =
  | { kind: 'youtube'; id: string; url: string; embed: string }
  | { kind: 'file'; url: string }
  | { kind: 'external'; url: string };

export function youtubeIdFrom(value: unknown): string;
export function youtubeId(content: unknown): string;
export function supportsNativeHls(): boolean;
export function watchTarget(content: unknown): WatchTarget;
export function normalizeSearch(search: unknown): string;
