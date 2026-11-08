/**
 * Upstream contract for https://stream.aryavidya.cc/
 *
 * The reference client talks to a single JSON endpoint:
 *   GET {API_BASE}/index.php?type=contents&metaData=<base64(xor(path, KEY))>
 * where `path` is a Physics-Wallah API path (e.g. /v3/batches/<id>/details).
 * Both the key and the request shape below were observed from the live client;
 * nothing here invents data — every response is passed through untouched.
 */
export const ORIGIN = 'https://stream.aryavidya.cc';
export const API_BASE = `${ORIGIN}/arshya`;
export const META_KEY = 'fgsbhv235793853rifjb';
export const CATALOG_URL = 'https://semfy-gros.github.io/batches/batcha.json';
export const PLAYER_URL = `${ORIGIN}/play.php`;

/** Only these upstream path families are proxied. */
const ALLOWED = [
  /^\/v1\/batches\/[a-f0-9]{24}\/(announcement|announcement\/v2|weekly-schedules)/i,
  /^\/v2\/batches\/[a-f0-9]{24}\/(subject\/[a-z0-9-]+\/(topics|contents)|todays-schedule|weekly-schedules)/i,
  /^\/v3\/batches\/[a-f0-9]{24}\/details$/i,
  /^\/v3\/test-service\/tests(\/|\?|$)/i,
  /^\/v2\/programs\/[a-f0-9]{24}\/(filters|subjects\/[a-f0-9]{24}\/chapters\/list|teachers)/i,
  /^\/batch-service\/v1\/batch-plans\/batch\/[a-f0-9]{24}\/plans$/i,
  /^\/student-engagement-core\/private\/v1\/study-material\/(exams-with-categories|get-child-nodes)/i
];

export function isAllowedPath(path) {
  return typeof path === 'string' && path.length < 600 && ALLOWED.some((re) => re.test(path));
}

export function encodeMeta(path, key = META_KEY) {
  const bytes = Buffer.from(String(path), 'utf8');
  return Buffer.from(bytes.map((b, i) => b ^ key.charCodeAt(i % key.length))).toString('base64');
}

export function decodeMeta(meta, key = META_KEY) {
  const bytes = Buffer.from(String(meta), 'base64');
  return Buffer.from(bytes.map((b, i) => b ^ key.charCodeAt(i % key.length))).toString('utf8');
}

export function upstreamUrl(path, type = 'contents') {
  return `${API_BASE}/index.php?type=${encodeURIComponent(type)}&metaData=${encodeURIComponent(encodeMeta(path))}`;
}

export async function fetchUpstream(path, { timeout = 20000, body = null } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(upstreamUrl(path), {
      method: body ? 'POST' : 'GET',
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'user-agent': 'Mozilla/5.0 (compatible; SignalStudy/1.0)',
        ...(body ? { 'content-type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw Object.assign(new Error('Upstream returned a non-JSON response'), { status: 502 });
    }
    if (!res.ok) throw Object.assign(new Error(body?.error?.message || `Upstream HTTP ${res.status}`), { status: res.status });
    return body;
  } catch (err) {
    if (err?.name === 'AbortError') throw Object.assign(new Error('The upstream API timed out. Please retry.'), { status: 504 });
    if (err?.message === 'fetch failed' || err?.code === 'ENOTFOUND' || err?.code === 'ECONNREFUSED') {
      throw Object.assign(new Error('This environment cannot reach stream.aryavidya.cc. Sandbox previews block outbound traffic to it — use the deployed Vercel URL for live data.'), { status: 502 });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** The same batch catalog the reference dashboard loads. */
export async function fetchCatalog({ timeout = 25000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${CATALOG_URL}?v=${Date.now()}`, { signal: controller.signal });
    if (!res.ok) throw Object.assign(new Error(`Catalog HTTP ${res.status}`), { status: 502 });
    const json = await res.json();
    const list = Array.isArray(json) ? json : json.batches || json.data || [];
    return { generated_at: json.generated_at ?? null, batches: list.filter((b) => b && b.batch_id) };
  } finally {
    clearTimeout(timer);
  }
}
