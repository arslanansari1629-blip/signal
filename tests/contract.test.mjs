import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeMeta, decodeMeta, upstreamUrl, isAllowedPath, META_KEY } from '../server/upstream.mjs';

// Captured from the live reference client — both round-trips must stay byte-exact.
const SAMPLES = [
  ['/v3/batches/62be8b94c1b06e00119564c8/details',
   'SRFATQoXRlBdUkocDgdRF1EEU1YFVhFSXhMCAwQGAAYOAVBKRgIPFgcOHxE='],
  ['/v2/batches/62be8b94c1b06e00119564c8/todays-schedule?batchId=62be8b94c1b06e00119564c8',
   'SRFBTQoXRlBdUkocDgdRF1EEU1YFVhFSXhMCAwQGAAYOAVBKRhIFBgceAE8bFVpWUUJVVgdXUgYKDiMGW1FBAA1OUAoBVAhRCANWQllXW1tTUUcBUA==']
];

test('metaData encoder reproduces captured client payloads exactly', () => {
  for (const [path, meta] of SAMPLES) {
    assert.equal(encodeMeta(path), meta);
    assert.equal(decodeMeta(meta), path);
  }
});

test('codec is an involution for arbitrary paths', () => {
  const path = '/v2/batches/65d86238fb2810001895eab8/subject/physics-013824/contents?tag=ch---01&contentType=notes&page=2';
  assert.equal(decodeMeta(encodeMeta(path)), path);
  assert.equal(META_KEY.length, 20);
});

test('upstream url is correctly escaped', () => {
  const url = upstreamUrl('/v3/batches/62be8b94c1b06e00119564c8/details');
  assert.ok(url.startsWith('https://stream.aryavidya.cc/arshya/index.php?type=contents&metaData='));
  assert.ok(!url.includes('+') && !url.includes('='+'='));
  assert.equal(decodeMeta(decodeURIComponent(url.split('metaData=')[1])), '/v3/batches/62be8b94c1b06e00119564c8/details');
});

test('proxy allowlist accepts known routes and rejects everything else', () => {
  const ok = [
    '/v3/batches/62be8b94c1b06e00119564c8/details',
    '/v2/batches/62be8b94c1b06e00119564c8/subject/physics-013824/topics?page=2',
    '/v2/batches/62be8b94c1b06e00119564c8/subject/physics-013824/contents?tag=x&contentType=videos&page=1',
    '/v2/batches/62be8b94c1b06e00119564c8/todays-schedule?batchId=62be8b94c1b06e00119564c8',
    '/v1/batches/62be8b94c1b06e00119564c8/announcement/v2?page=1',
    '/v3/test-service/tests?batchId=62be8b94c1b06e00119564c8&page=1',
    '/v2/programs/62c7bd151690a10018df0307/filters?page=1&limit=20',
    '/student-engagement-core/private/v1/study-material/get-child-nodes'
  ];
  for (const p of ok) assert.ok(isAllowedPath(p), p);
  const bad = ['http://evil.test/x', '/v1/users/me', '/v3/batches/xyz/details', '', null, '/v3/batches/62be8b94c1b06e00119564c8/details/../../admin'];
  for (const p of bad) assert.ok(!isAllowedPath(p), String(p));
});

test('browser encoder matches the server encoder', async () => {
  // Mirror of src/lib/upstream.ts using Web APIs available in Node 22.
  const KEY = 'fgsbhv235793853rifjb';
  const browserEncode = (path) => {
    const bytes = new TextEncoder().encode(path);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ KEY.charCodeAt(i % KEY.length);
    let binary = '';
    for (const byte of out) binary += String.fromCharCode(byte);
    return btoa(binary);
  };
  for (const [path, meta] of SAMPLES) assert.equal(browserEncode(path), meta);
});

test('upstream HTML error pages become one readable line', async () => {
  const { friendlyError } = await import('../src/lib/errors.mjs');
  const cloudflare = '<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title></head><body>cf</body></html>';
  assert.match(friendlyError(cloudflare), /bot protection/);
  assert.ok(!friendlyError(cloudflare).includes('<'));
  assert.equal(friendlyError('Batch not found'), 'Batch not found');
  assert.equal(friendlyError('  <b>Too   many</b>\n requests '), 'Too many requests');
  assert.equal(friendlyError(''), 'Something went wrong.');
  assert.ok(friendlyError('x'.repeat(500)).length <= 240);
});

test('youtube ids are recovered from every field the API populates', async () => {
  const { youtubeId, watchTarget } = await import('../src/lib/media.mjs');
  // The real shape: videoUrl/video_id/hls_url empty, id only in the thumbnail.
  const lecture = {
    urlType: 'youtube', url: '', isLocked: true,
    videoDetails: { video_id: '', videoUrl: '', hls_url: '', findKey: '62e10f4a7dc8640018f3dfe6',
                    image: 'https://i.ytimg.com/vi/nmp4YViMoOo/mqdefault.jpg' }
  };
  assert.equal(youtubeId(lecture), 'nmp4YViMoOo');
  const t = watchTarget(lecture);
  assert.equal(t.kind, 'youtube');
  assert.equal(t.embed, 'https://www.youtube-nocookie.com/embed/nmp4YViMoOo?autoplay=1&rel=0&modestbranding=1');

  assert.equal(youtubeId({ videoDetails: { videoUrl: 'https://www.youtube.com/watch?v=ZKvJvep2alY&t=9s' } }), 'ZKvJvep2alY');
  assert.equal(youtubeId({ url: 'https://youtu.be/_h3oLcYO-kE' }), '_h3oLcYO-kE');
  assert.equal(youtubeId({ videoDetails: { video_id: 'eVhFJb9U51s' } }), 'eVhFJb9U51s');
  assert.equal(youtubeId({ videoDetails: { embedCode: '<iframe src="https://www.youtube.com/embed/MMXkBblCVUY"></iframe>' } }), 'MMXkBblCVUY');
  // A Mongo ObjectId must never be mistaken for a video id.
  assert.equal(youtubeId({ _id: '62e10f4a7dc8640018f3dfe6', videoDetails: { findKey: '62e10f4a7dc8640018f3dfe6' } }), '');
  assert.equal(youtubeId({}), '');
  assert.equal(youtubeId(null), '');
});

test('protected streams fall back to AryaVidya instead of a broken player', async () => {
  const { watchTarget } = await import('../src/lib/media.mjs');
  const locked = { urlType: 'penpencilvdo', url: '', videoDetails: { videoUrl: '', hls_url: '', image: 'https://static.pw.live/x/y.jpg' } };
  assert.equal(watchTarget(locked).kind, 'external');
  assert.equal(watchTarget({ videoDetails: { videoUrl: 'https://cdn.example.com/a.mp4' } }).kind, 'file');
  // HLS needs native support; in node there is no document, so it must not claim playability.
  assert.equal(watchTarget({ videoDetails: { hls_url: 'https://cdn.example.com/a.m3u8' } }).kind, 'external');
});

test('entity-escaped links keep their sid parameter', async () => {
  const { normalizeSearch } = await import('../src/lib/media.mjs');
  const q = new URLSearchParams(normalizeSearch('name=Notices&amp;sid=6acc79c46866955558c48e05'));
  assert.equal(q.get('sid'), '6acc79c46866955558c48e05');
  assert.equal(q.get('name'), 'Notices');
  assert.equal(new URLSearchParams(normalizeSearch('a=1&#38;b=2')).get('b'), '2');
  assert.equal(new URLSearchParams(normalizeSearch('a=1&amp;amp;b=2')).get('b'), '2');
  assert.equal(normalizeSearch('name=Physics&sid=x'), 'name=Physics&sid=x');
});

test('expired upstream tokens are explained, not shown as a bot check', async () => {
  const { friendlyError } = await import('../src/lib/errors.mjs');
  assert.match(friendlyError('Token expired'), /access token for this batch has expired/);
});
