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

The e2e layer is a **pair of rules**, one per side — keep them consistent:
[`umit-mobilya-client/.claude/rules/11-e2e-conventions.md`](umit-mobilya-client/.claude/rules/11-e2e-conventions.md)
(Playwright budget + how a spec is written) and
[`umit-mobilya-server/.claude/rules/13-price-net.md`](umit-mobilya-server/.claude/rules/13-price-net.md)
(the frozen price goldens). The dividing line: **a number is asserted on the
server, never in the browser.**

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
- `umit-mobilya-server/` — NestJS + Mongoose REST API (TypeScript, strict)

## Commands

Client (`cd umit-mobilya-client`):

```bash
yarn dev          # vite dev server on port 3001 (the server's default CORS origin)
yarn lint         # eslint flat config (eslint.config.js)
yarn build        # vue-tsc -b && vite build
yarn type-check   # vue-tsc for src/ + tsc -p tsconfig.e2e.json for e2e/
yarn test:unit    # vitest (watch); vitest run <path> for a single file
yarn test:unit:run # vitest once — what the commit gate runs
yarn format       # prettier --write src/
yarn size-check   # main-bundle ceiling (1800 kB) — run it AFTER a build
yarn e2e:smoke    # Playwright: every route loads (~30 s)
yarn e2e:journeys # Playwright: the seven manifested journeys (~35 s)
```

Server (`cd umit-mobilya-server`):

```bash
yarn dev              # nest start --watch
yarn start            # node dist/main (PORT env, default 5000)
yarn test             # Jest: characterization + price net
yarn e2e:api          # hermetic Nest on mongodb-memory-server, port 5055 —
                      # what Playwright boots; not for day-to-day development
yarn price-net:bless  # regenerate the price goldens, then READ THE DIFF
```

Env files are gitignored and must exist locally:
- client `.env`: `VITE_API_URL`, `VITE_I18N_LOCALE`
- server `.env`: `MONGO_URI`, `JWT_SECRET`, `PORT`, `ALLOWED_ORIGINS`, `BUCKET_NAME`, `S3_ENDPOINT`, `PUBLIC_BUCKET_URL`, `ACCESS_KEY`, `SECRET_ACCESS_KEY`
  — plus the optional `LOCAL_STORAGE_DIR` / `LOCAL_STORAGE_URL`, which only
  matter when the R2 five are absent (see the storage section below).

A new `VITE_*` var must also be added in the Netlify dashboard, and a new server var in the Railway dashboard — neither is read from the repo.

Known broken/absent tooling — don't assume these work:
- `yarn generate-icon-names` points at `scripts/iconNameGenerator.js`, which
  doesn't exist. The `scripts/` directory itself does — it holds
  `size-check.mjs`, which `yarn size-check` runs.
- Client vitest covers pure functions only — the configurator's, plus
  `views/admin/_etc/colorValue`: **186 tests across 15 files**, still **no
  component tests**. Browser coverage is Playwright (`e2e/`), and it is
  deliberately thin: a smoke spec plus **seven** manifested journeys.
- Playwright needs its browser once: `npx playwright install chromium`.
  It is pinned to **1.61.1** because 1.62's chromium build refuses to install
  on macOS 13 — don't bump it without checking that.
- `tsconfig.*.tsbuildinfo` and `dist/` are both gitignored, so neither should
  ever appear in a diff.

## Dependencies

Both apps are yarn 1 with their own lockfile, and Dependabot watches both. The
tree was last swept to zero open alerts; four things about that sweep are worth
knowing before you touch a version, because each one looks like a mistake:

- **The server does not declare `express` and `multer` to use them directly** —
  it declares them so there is *one* copy. `@nestjs/platform-express` depends on
  express and multer itself, and it moved to **express 5 / multer 2** on its own.
  The root manifest had been left on express 4 / multer 1, so the app ran Nest's
  express 5 while `setup-app.ts` imported a *separate* express 4 for
  `express.json()`. That duplicate was the single largest source of alerts
  (express 4 drags in `path-to-regexp` 0.1.x, `body-parser` 1.x, old `qs`).
  Keep the root ranges in step with what platform-express resolves to.
- **`bcrypt` is on 6.x specifically to drop `@mapbox/node-pre-gyp`.** bcrypt 5's
  install toolchain pulled `tar` 6, which has no patched release — eleven alerts,
  one of them critical, all of them from a build-time dependency of a password
  hash. bcrypt 6 uses `node-gyp-build` and pulls neither. The hash format is
  unchanged, so stored passwords still verify.
- **`@nestjs/swagger` pins `js-yaml` to an exact version**, so the only way to
  patch it is the `resolutions` entry in the server's `package.json`. Yarn warns
  that the resolution is "incompatible with the requested version" on every
  install; that warning is the resolution working, not failing.
- **Unused packages were removed rather than upgraded.** `lodash`, `qs`, `uuid`
  and `exceljs` were declared on the client and imported nowhere — `exceljs` was
  reachable only through a type-augmentation file for code that no longer
  existed, and it was what dragged in the vulnerable `tmp` and `uuid` 8. Deleting
  an unused dependency closes its alerts permanently; upgrading it just schedules
  the next one.

Client `resolutions` is now empty. It used to pin `jackspeak` to 2.1.1, a
workaround for a broken 2.3.x publish that had become a *downgrade* below what
`glob` asks for.

## Skills and the gates that need them

Three gates are decided by a **skill** and merely *checked* by a hook — hooks are
deterministic shell, they cannot call a model:

| Skill | Gate it feeds | Marker |
|---|---|---|
| [`ai-review`](.claude/skills/ai-review/SKILL.md) | `pre-push-ai-review.sh` | `.git/ai-review-pass` — the reviewed HEAD |
| [`e2e-decision`](.claude/skills/e2e-decision/SKILL.md) | `enforce-e2e-decision.sh` | `.git/e2e-decision-pass` — hash of the staged diff |
| [`fiyat-degisikligi`](.claude/skills/fiyat-degisikligi/SKILL.md) | `enforce-price-decision.sh` | `.git/price-decision-pass` — hash of the staged golden diff |

All three markers are content-bound: a new commit, one more staged file or one
more moved golden re-arms the gate, because the decision was made about what was
actually read.

A fourth gate needs no skill, because its question has exactly one right answer:
`enforce-branch.sh` denies any `Write`/`Edit` inside the repo while `main` is
checked out. It sits at write time rather than at push time, so the question is
asked before the work starts instead of after it has already landed.

## Workflow skills — the operator's entry points

These are not gates; they are the paths a non-developer takes through the repo.
Each one encodes a sequence that is easy to half-finish:

| Skill | What it walks |
|---|---|
| [`urun-ekle`](.claude/skills/urun-ekle/SKILL.md) | A new configurator product, all eighteen steps, gardırop/vestiyer as the template |
| [`urun-duzenle`](.claude/skills/urun-duzenle/SKILL.md) | Editing an existing product, sorted by risk tier, with mandatory price reconciliation |
| [`fiyat-dogrula`](.claude/skills/fiyat-dogrula/SKILL.md) | Audits the price maths: proves the arithmetic, lists what only the workshop can confirm |
| [`yayinla`](.claude/skills/yayinla/SKILL.md) | Branch → merge → **re-run every gate on the merged state** → push → PR → delete branch |

`yayinla` exists for one specific reason: `git merge` creates its merge commit
without calling `git commit`, so none of the commit gates fire for it. Two
branches that are each green can merge into a red state and nothing says so.

The human-facing counterpart to all of this is [`KILAVUZ.md`](KILAVUZ.md) —
plain Turkish, no code vocabulary, written for whoever runs the business rather
than for a model.

**Routing.** `.claude/hooks/route-to-skill.sh` runs on `UserPromptSubmit`,
matches the Turkish sentence the owner actually types and injects which skill
owns the work. It exists because a skill being *visible* is not the same as it
being *called*: the likely failure is jumping straight into code and skipping an
eighteen-step checklist. It also catches the highest-value routing of all —
"fiyatları zamlayalım" is **not** a code task, it is the admin panel. The
matcher looks for Turkish word *stems*, because `gardırop` becomes `gardırobun`
and a whole-word pattern silently missed it (the hook suite caught that).

**Carry-over.** [`.claude/DURUM.md`](.claude/DURUM.md) holds what must survive
between sessions: answers awaited from the workshop, the assumption being used
until each arrives, and decisions nobody has made yet. **Read it before
answering a question about prices, defaults or manufacturing** — several numbers
in this repo are seed guesses that look authoritative. `fiyat-dogrula` both
reads and updates it.

## The testing layers, and which one owns what

| Question | Layer | Where |
|---|---|---|
| Is this arithmetic right? | vitest, pure functions | `umit-mobilya-client/src/views/configurator/_etc/**/*.spec.ts` |
| Does this design still cost the same? | golden net | `umit-mobilya-server/test/price-net/` |
| Is the HTTP contract intact? | characterization | `umit-mobilya-server/test/characterization/` |
| Do the two copies of the price engine still match? | byte-diff | `umit-mobilya-server/test/pricing-sync.spec.ts` |
| Does every screen still load? | Playwright smoke | `umit-mobilya-client/e2e/smoke.spec.ts` |
| Does the wiring hold in a real browser? | Playwright journey | `umit-mobilya-client/e2e/journeys/` |

The load-bearing invariant across all six: **the price on screen and the price
stored on the quote are the same number.** The engine is duplicated
(client for instant feedback, server so the amount is never the client's claim),
`pricing-sync` proves the copies are identical, the price net proves the numbers
are right, and `quote-price-roundtrip` proves the wiring between them.

## Backend architecture

**NestJS + TypeScript.** The Express/CommonJS version is gone — no `.js` source
file remains, and nothing is mounted by hand any more.

`main.ts` boots `AppModule` and applies `setup-app.ts`, which is shared with the
test harness so a spec can never exercise a differently-configured app:
`trust proxy`, body parsers, cookie-parser, the global `ValidationPipe`
(`whitelist` + `forbidNonWhitelisted` + `transform`), `AllExceptionsFilter`,
CORS from `ALLOWED_ORIGINS`, and Swagger on `/docs` (+ `/docs-json`).

`AppModule` wires `ConfigModule` (validated at boot, skips `.env` under
`NODE_ENV=test`), `MongooseModule`, `ThrottlerModule`, and six feature
modules. Each domain is a `schemas/` + `dto/` + service + controller + module
set; `src/category/` is the smallest complete example.

| Domain | Owns |
|---|---|
| `auth/` | signup, login, logout, me; `JwtAuthGuard` |
| `category/` | the reference domain |
| `product/` | the portfolio, R2 images |
| `configurator/` | the price book and the price engine |
| `quote/` | quote requests, the frozen price, the PDF |
| `storage/` | `ObjectStorageService` — the only thing that talks to R2 — plus `LocalDiskStorage` and the controller that serves it |

**Auth**: JWT (3-day expiry) returned in the login response *and* set as an
`httpOnly` `jwt` cookie. `JwtAuthGuard` is applied per route with `@UseGuards`,
not globally — `GET` is public, `POST`/`PUT`/`DELETE` sit behind it. The
deliberate exceptions are the whole `auth` domain, `POST /api/products/filter`
(a mutation verb running a read), and the public quote endpoints.

**Rate limiting**: `ThrottlerGuard` is registered globally as `APP_GUARD` —
300/min per IP, narrowed to 5/min on the public `POST /api/quotes`. `trust proxy`
is set to `1` so the counter sees the real client behind Railway's proxy rather
than lumping every visitor into one bucket.

**The price engine is duplicated on purpose.** `src/configurator/generated/` is
a byte-identical copy of the client's `_etc/pricing`, `geometry/units.ts` and
each product's `parts.ts` + `options.ts`, produced by `yarn sync:pricing` and
pinned by `test/pricing-sync.spec.ts`. `options.ts` is in that list for the
price net rather than the engine: the goldens price each product's **own**
default design, so editing `createDefaultConfig` moves a golden instead of
silently moving the first number a customer sees. The
client needs it so the panel updates without a round trip; the server needs it
so the amount on a quote is never the client's claim. `POST /api/quotes`
**rejects** a `price` in the body (400, via `forbidNonWhitelisted`), recomputes,
and **freezes** the parts + breakdown + `priceBookVersion` into the record, so
changing the price book never moves a quote that was already given.

**Price book**: `GET /api/pricebook` is public (the configurator's catalogue) and
the profit margin is stripped from that response. `publish` never updates a row —
it writes a new version and moves the `active` flag.

**Images / object storage** — the core non-obvious piece, now inside
`ObjectStorageService` + `ProductService`:
- Storage is **Cloudflare R2**, driven through `@aws-sdk/client-s3` because R2 is S3-compatible. The client is configured with `region: 'auto'` and `endpoint` from `S3_ENDPOINT` — both are R2 requirements.
- MongoDB stores only **keys** (`imageName`, `imageNameList[]`), never URLs. This keeps rows portable if the public domain or bucket changes.
- The bucket is **public**. The URL is composed synchronously from `PUBLIC_BUCKET_URL` and the URL-encoded key — no signing, no expiry. `imageUrl`/`imageUrlList` are stable, so browser and CDN caching work.
- Keys are slugified (non-`[\w.-]` runs collapse to `-`, lowercased) and suffixed with random hex, because the key ends up inside a public URL.
- **With the R2 five absent there are two different behaviours, split on `NODE_ENV`.** Outside production the service falls back to `LocalDiskStorage` (`LOCAL_STORAGE_DIR`, default `.local-storage`) and serves the files back through `GET /api/storage/:key`, so a feature like the finish texture can be built without an R2 account. Under `NODE_ENV=production` there is **no** fallback: it warns, upload answers **503**, and everything else works. Railway's filesystem is ephemeral, so a "working" local-disk upload there is an upload that silently disappears on the next deploy.
- Uploads arrive as buffers, not temp files — `FileInterceptor` is used with Nest's default memory storage → `sharp` resize → `PutObjectCommand` (or a local write). Nothing is streamed to a temp directory.
- Single main image on `POST /api/products`; gallery on `PUT /api/products/create-images/:id` — the field name there is still singular `image`.
- Deleting a record deletes the object, and membership is checked first. Deletion failures are logged and swallowed so a storage outage can't block the DB delete.

**Surprises worth knowing**: `GET /api/products` and `/:id` answer **201**
(inherited, pinned by the characterization suite). Route declaration order
matters — `create-images/:id` must come before `:id`. A `@Body()` parameter typed
`Dto | undefined` silently disables validation for that endpoint.

Product `price`, `currency`, `quantity` and `modules[]` were **removed**: the
module system was a primitive version of what the configurator does properly,
and a fixed price is wrong for made-to-measure work. The portfolio shows no
price; everything routes to a quote.

## Frontend architecture

**Bootstrap**: `main.ts` installs `router` then `plugins/index.ts`, which composes pinia, i18n, `globalComponents`, primeVue, toast, `reveal` and `v-click-outside`. `plugins/apiClient.ts` is imported for side effects only.

**API layer**: `src/client/` is **generated** from the server's `openapi.json`
(`yarn gcl`) — there is no hand-written axios layer any more. Every call goes
through a generated service; nothing assembles a URL. `plugins/apiClient.ts` is
the only place that configures it (`OpenAPI.BASE` from `VITE_API_URL` with the
`/api` suffix stripped, `OpenAPI.TOKEN` resolved from localStorage per request).

**Never add a global axios interceptor.** The old layer installed
`response => response.data`; the generated client shares that axios instance and
reads `response.status`, so every successful request threw
`Generic Error: status: unknown` while the network tab showed 200.

**Stores** (`src/stores/`): options-API Pinia stores keyed by `EStoreNames`, except `auth.ts` which is setup-style. Actions are plain `async` functions that `await` the generated service and reset `loading`/`saving` in `finally`; rejections propagate to the caller. `users.ts` holds the current user + `isAuthenticated`; `auth.ts` owns the localStorage token and delegates user state to `users.ts`.

**Routing** (`src/router/`): `routes.ts` nests everything under `DefaultLayout`. `ERouteNames` values are **Turkish display strings** used simultaneously as route `name`, `meta.title`, and sidebar labels — changing a value changes the URL-independent route identity everywhere. The guard in `index.ts` restores the session from `localStorage` (`EStorageKeys.TOKEN`) via `usersStore.fetchUser` before each navigation.

**Components**:
- `src/components/ui/global/*.vue` are auto-registered by `plugins/globalComponents.ts` with an **`F` prefix** (`Input.vue` → `<FInput>`). Add a file there and it's globally available; no import needed.
- PrimeVue components are auto-imported via `unplugin-vue-components` + `PrimeVueResolver` (see the generated `components.d.ts`); many are *also* explicitly registered in `plugins/primeVue/primeVue.ts`. If a PrimeVue component isn't resolving, register it there.
- The `F*` wrappers integrate PrimeVue inputs with vee-validate + yup field state (`errorMessage`, `isValid`).
- Theming: custom `flexyPreset` in `plugins/primeVue/flexytheme.ts`, plus Tailwind whose palette comes from `src/constants/colors.ts`.

**Feature folder convention** under `src/views/<feature>/`: `_views/` (route components), `_components/` (feature-local pieces), `_modals/` (dialogs), `_etc/` (feature enums/helpers). Layouts follow the same idea with `layouts/<name>/_components/`.

**Configurator** (`src/views/configurator/`) is the largest feature and the only
**lazily loaded** route: Three.js and the product definitions are ~500 kB and
only the people who open `/tasarla/:product` should pay for them. A file that is
always loaded (layout, composable, router) must not import `registry.ts`, a
product module, or `three` — a hook enforces this, because the one time it
happened the main bundle went from 1 741 kB to 2 237 kB with no test failing.

Inside it, `_etc/pricing/` and `_etc/products/<slug>/parts.ts` are the
**portable core**: no Vue, no Three.js, copied verbatim to the server. One
`partsOf(config)` list feeds both the 3D scene and the price, so the wardrobe on
screen and the wardrobe being priced cannot drift apart. Products never import
each other.

**SFC section order** (from `umit-mobilya-client/notes.md` — follow it in new components):
imports → `IProps`/`defineProps` → `IEmits`/`defineEmits` → composables & stores → `ref` → `computed` → functions → `watch` → `onMounted`.

**Toasts**: use `useFToast()` (`composables/useFToast.ts`) — `showSuccessMessage` / `showErrorMessage`, which render the `SuccessToast`/`ErrorToast` components through vue-toastification. Don't call `useToast()` directly.

**i18n**: `vue-i18n` with `en.json` eager, `tr.json` lazily imported by `setI18nLanguage`. Note that much user-facing copy is hardcoded Turkish in templates rather than routed through i18n keys; code comments are mixed Turkish/English.

## Deployment

**Nothing is deployed yet.** The AWS account is closed and no host is currently
connected, so a push publishes code and nothing more. The section below is the
*intended* setup, kept because the config for it is already in the repo — treat
it as a plan, not as a running system, and update it the day a host is wired up.

There is also **no CI** — no `.github/` directory. Neither host type-checks, lints
or tests; they only build. Every gate that exists is local (see
[`done-checklist.md`](.claude/rules/done-checklist.md)).

- **Frontend → Netlify.** `netlify.toml` sits at the **repo root** (Netlify only looks there) and sets `base = umit-mobilya-client`, `command = yarn build`, `publish = dist`, and pins **Node 22**. That pin was 18 until the toolchain moved to vite 6 / vitest 3; 18 is end-of-life and, more to the point, every local gate is now run on 22, so pinning anything else would deploy a combination nobody has built. `public/_redirects` holds the SPA fallback (`/* /index.html 200`); without it a direct visit to `/login` or `/products` 404s, because the router uses `createWebHistory`. Env vars come from the Netlify dashboard.
- **Backend → Railway.** `yarn start` (`node dist/main`) is the start command,
  which means a build step (`nest build`) has to run first — the Express era
  needed none, so this is the first thing to verify when a host is connected;
  `main.ts` already honours the injected `PORT`. There is no Dockerfile in the server, so Nixpacks detects it; the root directory must be set to `umit-mobilya-server`. Env vars come from the Railway dashboard, and dependencies are installed on deploy.
- **Images → Cloudflare R2**, **database → MongoDB Atlas** (Atlas needs Railway's egress allowed under Network Access).

The server's CORS allowlist is read from `ALLOWED_ORIGINS` (comma-separated, defaults to `http://localhost:3001`), so a new frontend domain is an env change, not a code change.
