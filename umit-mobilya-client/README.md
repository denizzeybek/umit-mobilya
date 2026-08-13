# umit-mobilya-client

Vue 3 + TypeScript + Vite SPA. The public site (portfolio, configurator, quote
request) and the admin screens (price book, quotes, categories).

For what the project *is*, see the [repository README](../README.md).
For how the code is organised and the rules that govern it, see
[`CLAUDE.md`](CLAUDE.md) — it indexes `.claude/rules/`.

## Setup

```bash
yarn install
npx playwright install chromium   # once, before the first e2e run
```

Create `.env` (gitignored) with:

```
VITE_API_URL=http://localhost:5000/api
VITE_I18N_LOCALE=tr
```

`VITE_API_URL` ends with `/api`; `plugins/apiClient.ts` strips that suffix
because the generated client's paths already carry it. A new `VITE_*` variable
must also be added in the Netlify dashboard — it is not read from the repo.

## Commands

```bash
yarn dev          # vite on port 3001 (the server's default CORS origin)
yarn build        # vue-tsc -b && vite build
yarn preview      # serve the production build
yarn lint         # eslint flat config
yarn type-check   # vue-tsc for src/ + tsc for e2e/
yarn test:unit    # vitest (watch); `yarn test:unit run` for one pass
yarn format       # prettier --write src/
yarn size-check   # main-bundle ceiling — run AFTER a build
yarn gcl          # regenerate src/client from ../umit-mobilya-server/openapi.json
yarn e2e:smoke    # Playwright: every route loads
yarn e2e:journeys # Playwright: the seven manifested journeys
```

`yarn generate-icon-names` is broken — it points at a script that does not exist.

## Things that surprise people

- Components in `src/components/ui/global/` are registered globally with an `F`
  prefix (`Input.vue` → `<FInput>`). Never import them.
- `src/client/` is **generated** from the server's OpenAPI schema and must not be
  hand-edited. Never add a global axios interceptor — it breaks that client in a
  way that looks like a server error.
- `ERouteNames` values are Turkish display strings used simultaneously as route
  name, page title and nav label. Renaming one is not a copy change.
- `public/_redirects` is the SPA fallback. Deleting it breaks every deep link in
  production while `yarn dev` stays perfectly happy.
- The configurator is the only lazily-loaded route, and that is deliberate: a
  file that is always loaded must not import `three` or the product registry.
