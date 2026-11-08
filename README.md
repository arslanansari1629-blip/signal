# AryaVidya — Study Portal

A fast React + Vite front end for browsing batches, chapters, lectures, notes, tests,
schedules and the PDF bank, backed by two small Vercel serverless functions.

**All course data is live.** Nothing is mocked or hard-coded: every screen is rendered
from responses returned by `stream.aryavidya.cc`.

## How the data layer works

The reference client talks to one endpoint:

```
GET https://stream.aryavidya.cc/arshya/index.php?type=contents&metaData=<payload>
payload = base64( xor(utf8(apiPath), key) )      # 20-byte repeating key
```

`server/upstream.mjs` implements that codec (verified byte-for-byte against payloads
captured from the live client) and exposes it only through an allow-listed proxy:

| Route | Purpose |
| --- | --- |
| `GET /api/catalog` | Batch catalog (`semfy-gros.github.io/batches/batcha.json`), cached 10 min |
| `GET /api/proxy?path=…` | Allow-listed upstream GET (batch, topics, contents, tests, schedule, announcements, khazana, PDF bank) |
| `POST /api/proxy?path=…/get-child-nodes` | PDF-Bank tree traversal, body `{ "deeplink": "/JEE/Mindmaps" }` |

The same handlers run inside Vite's dev/preview server (`vite.config.ts`), so
`npm run dev` and the deployed app behave identically.

### Access rules are preserved

Lecture playback deep-links into the original AryaVidya player, which enforces its own
authentication and entitlements. This app never bypasses a lock, subscription or token.

## Features

- Dashboard with quick hub, favorites, shuffleable batch picks and continue-watching
- All Batches: fuzzy/Hinglish-tolerant search plus exam / class / language filters
- Batch page: subjects, description, test series & DPP, announcements, daily/weekly schedule
- Subject → chapters → lectures & notes, with an inline PDF viewer and download links
- PDF Bank: exam → category → folder traversal over the live study-material tree
- Khazana: recorded course library per batch programme and subject
- Favorites, history, saved PDFs and light/dark theme, all stored locally

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # codec + allow-list contract tests
npm run build    # type-check + production bundle
```

> The Arena sandbox blocks outbound traffic to `stream.aryavidya.cc`, so API panels show
> a clear error there. The deployed Vercel app has full network access and renders live data.

## Deployment

`vercel.json` builds with Vite, emits `dist/`, and runs `api/*.mjs` as Node functions.
SPA rewrites exclude `/api/*`.
