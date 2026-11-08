# Vercel bootstrap deployment

This folder is the exact file set uploaded to Vercel. The account has no GitHub
integration installed, so instead of linking the repo we upload five small files and
let `postinstall` (`fetch-src.mjs`) pull the real source tree from
`codeload.github.com` for branch `arena/4daa0992-signal`.

- `package.json` — same dependencies/scripts as the app, plus the bootstrap hook
- `vercel.json` — Vite build, `dist/` output, `api/*.mjs` functions, SPA rewrite
- `fetch-src.mjs` — downloads + extracts `src/`, `api/`, `server/`, `index.html`, configs
- `api/proxy.mjs`, `api/catalog.mjs` — placeholders so Vercel registers both functions;
  the real implementations overwrite them before the build runs

Override the source with `SOURCE_REPO` / `SOURCE_REF` environment variables.
Once the GitHub integration is installed you can delete this folder and link the
repository to the project directly.
