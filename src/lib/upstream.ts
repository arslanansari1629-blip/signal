/**
 * Browser-side implementation of the reference client's request contract:
 *   GET {ORIGIN}/arshya/index.php?type=contents&metaData=base64(xor(path, KEY))
 *
 * The upstream sends `access-control-allow-origin: *`, so the browser can call it
 * directly. That keeps requests on the visitor's own connection (the site's CDN
 * challenges datacenter IPs, so a server-side hop is only used as a fallback).
 */
export const ORIGIN = 'https://stream.aryavidya.cc';
export const API_BASE = `${ORIGIN}/arshya`;
const KEY = 'fgsbhv235793853rifjb';

export function encodeMeta(path: string): string {
  const bytes = new TextEncoder().encode(path);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ KEY.charCodeAt(i % KEY.length);
  let binary = '';
  for (const byte of out) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export const directUrl = (path: string) =>
  `${API_BASE}/index.php?type=contents&metaData=${encodeURIComponent(encodeMeta(path))}`;

export const proxyUrl = (path: string) => `/api/proxy?path=${encodeURIComponent(path)}`;
