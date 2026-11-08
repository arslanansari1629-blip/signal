import { fetchUpstream, isAllowedPath } from '../server/upstream.mjs';

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 8192) { reject(new Error('Body too large')); req.destroy(); }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.searchParams.get('path');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  if (!isAllowedPath(path)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: { message: 'Unsupported upstream path' } }));
    return;
  }
  // PDF-Bank tree nodes are fetched with a POST { deeplink } body upstream.
  let payload = null;
  if (req.method === 'POST') {
    if (!path.startsWith('/student-engagement-core/private/v1/study-material/get-child-nodes')) {
      res.statusCode = 405;
      res.end(JSON.stringify({ success: false, error: { message: 'POST is only supported for study-material nodes' } }));
      return;
    }
    const raw = await readBody(req);
    try {
      const parsed = JSON.parse(raw || '{}');
      if (typeof parsed.deeplink !== 'string' || parsed.deeplink.length > 400) throw new Error('bad deeplink');
      payload = { deeplink: parsed.deeplink };
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: { message: 'Expected JSON body { deeplink: string }' } }));
      return;
    }
  }
  try {
    const body = await fetchUpstream(path, { body: payload });
    res.setHeader('cache-control', 'public, max-age=0, s-maxage=120, stale-while-revalidate=600');
    res.statusCode = 200;
    res.end(JSON.stringify(body));
  } catch (err) {
    res.statusCode = err?.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ success: false, error: { message: err?.message || 'Upstream request failed' } }));
  }
}
