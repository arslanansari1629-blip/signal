// Placeholder so Vercel registers the function; replaced by the real
// api/catalog.mjs from the repository during `postinstall` (see fetch-src.mjs).
export default function handler(_req, res) {
  res.statusCode = 500;
  res.end(JSON.stringify({ success: false, error: { message: 'Source bootstrap did not run' } }));
}
