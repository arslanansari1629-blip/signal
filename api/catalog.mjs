import { fetchCatalog } from '../server/upstream.mjs';

let cache = { at: 0, data: null };

export default async function handler(req, res) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  try {
    if (!cache.data || Date.now() - cache.at > 10 * 60 * 1000) {
      cache = { at: Date.now(), data: await fetchCatalog() };
    }
    res.setHeader('cache-control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600');
    res.statusCode = 200;
    res.end(JSON.stringify(cache.data));
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ success: false, error: { message: err?.message || 'Catalog request failed' } }));
  }
}
