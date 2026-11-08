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
