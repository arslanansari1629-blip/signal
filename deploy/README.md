# Vercel bootstrap deployment

This folder is the exact file set uploaded to Vercel. The account has no GitHub
integration installed, so instead of linking the repo we upload five small files and
let `postinstall` (`fetch-src.mjs`) pull the real source tree from
`codeload.github.com`, pinned to commit `b8426eba18f023327a46406ab82fd479034b8634`.

- `package.json` — same dependencies/scripts as the app, plus the bootstrap hook
- `vercel.json` — Vite build, `dist/` output, `api/*.mjs` functions, SPA rewrite
- `fetch-src.mjs` — downloads + extracts `src/`, `api/`, `server/`, `index.html`, configs
- `api/proxy.mjs`, `api/catalog.mjs` — placeholders so Vercel registers both functions;
  the real implementations overwrite them before the build runs

Override the source with `SOURCE_REPO` / `SOURCE_REF` environment variables
(`SOURCE_REF` accepts a branch name such as `main`, or a commit SHA). To ship a newer
commit, update the pinned SHA in `fetch-src.mjs` and redeploy.
Once the GitHub integration is installed you can delete this folder and link the
repository to the project directly.
