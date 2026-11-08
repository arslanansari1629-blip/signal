// Reference API contract (observed from stream.aryavidya.cc client):
//   GET {API_BASE}/index.php?type=contents&metaData=base64(xor(path, KEY))
export const KEY = 'fgsbhv235793853rifjb';
export const API_BASE = 'https://stream.aryavidya.cc/arshya';
export function encodeMeta(path, key = KEY) {
  const bytes = Buffer.from(String(path), 'utf8');
  return Buffer.from(bytes.map((b, i) => b ^ key.charCodeAt(i % key.length))).toString('base64');
}
export function decodeMeta(meta, key = KEY) {
  const bytes = Buffer.from(String(meta), 'base64');
  return Buffer.from(bytes.map((b, i) => b ^ key.charCodeAt(i % key.length))).toString('utf8');
}
export function apiUrl(path, type = 'contents') {
  return `${API_BASE}/index.php?type=${encodeURIComponent(type)}&metaData=${encodeURIComponent(encodeMeta(path))}`;
}
if (process.argv[2]) console.log(apiUrl(process.argv[2], process.argv[3] || 'contents'));
