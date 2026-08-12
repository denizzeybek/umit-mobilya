# CLAUDE.md

This file describes the **architecture**. The rules that govern how code is
written live in `.claude/rules/` — read the one that covers what you are about
to touch.

## Rules index

Repo-wide (`.claude/rules/`), applying to both apps:

| File | Covers |
|---|---|
| [`comment-policy.md`](.claude/rules/comment-policy.md) | Which `//` comments the global hook allows; where JSDoc is functional |
| [`done-checklist.md`](.claude/rules/done-checklist.md) | The gates to run before calling a change done — there is no CI here |
| [`git-workflow.md`](.claude/rules/git-workflow.md) | Branch first, Turkish commit messages, `main` is deployed |

Per app:

- **Client** — `umit-mobilya-client/.claude/rules/`, indexed in
  [`umit-mobilya-client/CLAUDE.md`](umit-mobilya-client/CLAUDE.md): TypeScript
  strictness, API layer, Vue components, generated code, forms and tables,
  routing and config.
- **Server** — `umit-mobilya-server/.claude/rules/`, indexed in
  [`umit-mobilya-server/CLAUDE.md`](umit-mobilya-server/CLAUDE.md): TDD
  discipline, backend architecture, validation and errors, config and secrets.

## Repository layout

Two independent apps in one repo (no workspace tooling — each has its own `package.json`/lockfile):

- `umit-mobilya-client/` — Vue 3 + TypeScript + Vite SPA (yarn)
- `umit-mobilya-server/` — Express + Mongoose REST API (CommonJS, no TypeScript)

## Commands

Client (`cd umit-mobilya-client`):

```bash
yarn dev          # vite dev server on port 3001 (the server's default CORS origin)
yarn lint         # eslint flat config (eslint.config.js)
yarn build        # vue-tsc -b && vite build
yarn type-check   # vue-tsc --noEmit -p tsconfig.vitest.json
yarn test:unit    # vitest (watch); vitest run <path> for a single file
yarn format       # prettier --write src/
```

Server (`cd umit-mobilya-server`):

```bash
yarn dev          # nodemon app.js
yarn start        # node app.js  (PORT env, default 5000)
```

Env files are gitignored and must exist locally:
- client `.env`: `VITE_API_URL`, `VITE_I18N_LOCALE`
- server `.env`: `MONGO_URI`, `JWT_SECRET`, `PORT`, `ALLOWED_ORIGINS`, `BUCKET_NAME`, `S3_ENDPOINT`, `PUBLIC_BUCKET_URL`, `ACCESS_KEY`, `SECRET_ACCESS_KEY`

A new `VITE_*` var must also be added in the Netlify dashboard, and a new server var in the Railway dashboard — neither is read from the repo.

Known broken/absent tooling — don't assume these work:
- `yarn generate-icon-names` points at a `scripts/` directory that doesn't exist.
- Client tests cover only the configurator's pure functions (79 vitest tests);
  there are no component or e2e tests. The server has its own Jest suite.
- `tsconfig.*.tsbuildinfo` files are committed and churn on every build; ignore them in diffs. (`dist/` is gitignored.)

## Backend architecture

`app.js` → `routes/index.js` mounts three routers under `/api/auth`, `/api/products`, `/api/categories`. Each domain is a `routes/*.route.js` + `controllers/*.controller.js` + `models/*.model.js` triple.

**Auth**: JWT signed in `auth.controller.js` (3-day expiry), returned in the login response *and* set as an `httpOnly` `jwt` cookie. Two middlewares in `middleware/auth.middleware.js`: `requireAuth` reads the `Authorization: Bearer` header (used on all mutating routes), `checkUser` reads the cookie. Password hashing + a `User.login()` static live as Mongoose hooks on `models/user.model.js`.

**Images / object storage** — the core non-obvious piece, all inside `controllers/product.controller.js`:
- Storage is **Cloudflare R2**, driven through `@aws-sdk/client-s3` because R2 is S3-compatible. The client is configured with `region: 'auto'` and `endpoint: process.env.S3_ENDPOINT` — both are R2 requirements.
- MongoDB stores only **keys** (`imageName`, `imageNameList[]`), never URLs. This keeps rows portable if the public domain or bucket changes.
- The bucket is **public**. `generateImageUrl()` is synchronous and just joins `PUBLIC_BUCKET_URL` with the URL-encoded key — no signing, no expiry. Response `imageUrl`/`imageUrlList` values are stable, so browser and CDN caching work; they may be cached freely.
- Keys are built by `buildImageKey()`: the original filename is slugified (non-`[\w.-]` runs collapse to `-`, lowercased) and suffixed with 32 random bytes of hex. Slugifying matters because the key is now part of a public URL.
- Uploads use `multer.memoryStorage()` (buffers, not disk) → `sharp` resize → `PutObjectCommand`.
- Single main image: `upload.single('image')` on `POST /api/products`. Gallery: `upload.array('image', 20)` on `PUT /api/products/create-images/:id` — note the field name is still singular `image`.
- Both `deleteImage` and `deleteProduct` remove the objects from R2; deletion failures are logged and swallowed so a storage error can't block the DB delete.

**Modular products**: `product.modules` is an array of `{ productId: ObjectId(ref Product), quantity }`. A product is both a standalone item and a possible module of another. Read queries deep-populate `modules.productId` *and* its `category`, then flatten each module into `{_id, name, price, currency, imageUrl, quantity}` before responding — so the API shape of a module differs from the stored schema. Module endpoints: `POST /add-module`, `DELETE /remove-module/:productId/:moduleId`, `PUT /update-modules/:id`.

## Frontend architecture

**Bootstrap**: `main.ts` installs `router` then `plugins/index.ts`, which composes pinia, i18n, `globalComponents`, primeVue, toast, and `v-click-outside`. `plugins/axios.ts` is imported for side effects only.

**Axios**: a global response interceptor returns `response.data` directly, so every store action receives the payload body, not an AxiosResponse. That's why stores cast with `as unknown as IProduct[]`. Auth token is attached to `axios.defaults.headers.common` by the router guard, not by an interceptor.

**Stores** (`src/stores/`): options-API Pinia stores keyed by `EStoreNames`, except `auth.ts` which is setup-style. All actions follow a hand-rolled `return new Promise((resolve, reject) => axios...then/catch)` wrapper — match that style when adding actions. `users.ts` holds the current user + `isAuthenticated`; `auth.ts` owns localStorage token/user and delegates user state to `users.ts`.

**Routing** (`src/router/`): `routes.ts` nests everything under `DefaultLayout`. `ERouteNames` values are **Turkish display strings** used simultaneously as route `name`, `meta.title`, and sidebar labels — changing a value changes the URL-independent route identity everywhere. The guard in `index.ts` restores the session from `localStorage` (`EStorageKeys.TOKEN`) via `usersStore.fetchUser` before each navigation.

**Components**:
- `src/components/ui/global/*.vue` are auto-registered by `plugins/globalComponents.ts` with an **`F` prefix** (`Input.vue` → `<FInput>`). Add a file there and it's globally available; no import needed.
- PrimeVue components are auto-imported via `unplugin-vue-components` + `PrimeVueResolver` (see the generated `components.d.ts`); many are *also* explicitly registered in `plugins/primeVue/primeVue.ts`. If a PrimeVue component isn't resolving, register it there.
- The `F*` wrappers integrate PrimeVue inputs with vee-validate + yup field state (`errorMessage`, `isValid`).
- Theming: custom `flexyPreset` in `plugins/primeVue/flexytheme.ts`, plus Tailwind whose palette comes from `src/constants/colors.ts`.

**Feature folder convention** under `src/views/<feature>/`: `_views/` (route components), `_components/` (feature-local pieces), `_modals/` (dialogs), `_etc/` (feature enums/helpers). Layouts follow the same idea with `layouts/<name>/_components/`.

**SFC section order** (from `umit-mobilya-client/notes.md` — follow it in new components):
imports → `IProps`/`defineProps` → `IEmits`/`defineEmits` → composables & stores → `ref` → `computed` → functions → `watch` → `onMounted`.

**Toasts**: use `useFToast()` (`composables/useFToast.ts`) — `showSuccessMessage` / `showErrorMessage`, which render the `SuccessToast`/`ErrorToast` components through vue-toastification. Don't call `useToast()` directly.

**i18n**: `vue-i18n` with `en.json` eager, `tr.json` lazily imported by `setI18nLanguage`. Note that much user-facing copy is hardcoded Turkish in templates rather than routed through i18n keys; code comments are mixed Turkish/English.

## Deployment

There is **no CI in this repo** — no `.github/` directory. Both hosts deploy from git themselves:

- **Frontend → Netlify.** `netlify.toml` sits at the **repo root** (Netlify only looks there) and sets `base = umit-mobilya-client`, `command = yarn build`, `publish = dist`, and pins Node 18. `public/_redirects` holds the SPA fallback (`/* /index.html 200`); without it a direct visit to `/login` or `/products` 404s, because the router uses `createWebHistory`. Env vars come from the Netlify dashboard.
- **Backend → Railway.** `yarn start` (`node app.js`) is the start command and `app.js` already honours the injected `PORT`. There is no Dockerfile in the server, so Nixpacks detects it; the root directory must be set to `umit-mobilya-server`. Env vars come from the Railway dashboard, and dependencies are installed on deploy.
- **Images → Cloudflare R2**, **database → MongoDB Atlas** (Atlas needs Railway's egress allowed under Network Access).

The server's CORS allowlist is read from `ALLOWED_ORIGINS` (comma-separated, defaults to `http://localhost:3001`), so a new frontend domain is an env change, not a code change.
