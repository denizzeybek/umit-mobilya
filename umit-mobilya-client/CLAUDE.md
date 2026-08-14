# CLAUDE.md — client

Index only. Every rule that governs code in `umit-mobilya-client/` is defined in
`.claude/rules/`; this file points at them. Architecture lives in the root
`CLAUDE.md`.

## Rules

| File | Covers |
|---|---|
| [`01-typescript-strict.md`](.claude/rules/01-typescript-strict.md) | `any` ban and the `// reason:` escape, no `as unknown as`, `noImplicitAny` is ON |
| [`02-api-layer.md`](.claude/rules/02-api-layer.md) | Generated services only, store action shape (`async/await` + `try/finally`), error handling, multipart |
| [`03-vue-components.md`](.claude/rules/03-vue-components.md) | SFC section order, `F*` auto-registration, PrimeVue registration, the modal pattern, colour tokens |
| [`04-generated-code.md`](.claude/rules/04-generated-code.md) | `components.d.ts` and `src/client/` — never hand-edited, how to regenerate |
| [`05-forms-and-tables.md`](.claude/rules/05-forms-and-tables.md) | vee-validate + yup wiring, `DataTable` defaults, client vs server filtering |
| [`06-routing-and-config.md`](.claude/rules/06-routing-and-config.md) | `ERouteNames` as identity, router guard, `EStorageKeys`, `VITE_*` vars, Netlify, i18n reality |
| [`07-naming-and-files.md`](.claude/rules/07-naming-and-files.md) | Where a file goes, what it is called, which names are identities |
| [`08-file-size-and-splitting.md`](.claude/rules/08-file-size-and-splitting.md) | 250-line cap on `.vue`/`.ts`, how to split, which files are exempt |
| [`09-ui-controls.md`](.claude/rules/09-ui-controls.md) | `F*` first, then PrimeVue, raw HTML controls only with `raw-control:` |
| [`10-product-modules.md`](.claude/rules/10-product-modules.md) | Configurator product family: no cross-product imports, limits are passed not imported |
| [`11-e2e-conventions.md`](.claude/rules/11-e2e-conventions.md) | Playwright budget (manifested journeys, wall-clock ceilings) **and** how a spec is written: fixtures import, `data-testid` selectors, awaited web-first assertions, no sleeps/try-catch/only |

Repo-wide rules that also apply here: [`comment-policy.md`](../.claude/rules/comment-policy.md),
[`done-checklist.md`](../.claude/rules/done-checklist.md),
[`git-workflow.md`](../.claude/rules/git-workflow.md).

## Commands

```bash
yarn dev          # vite on port 3001 — never run this in a tool call, it blocks
yarn lint         # eslint flat config; must be clean before a change is done
yarn type-check   # vue-tsc for src/ + tsc -p tsconfig.e2e.json for e2e/
yarn build        # vue-tsc -b && vite build
yarn test:unit    # vitest (watch)
yarn test:unit:run # vitest once — what the commit gate runs
yarn format       # prettier --write src/
yarn gcl          # regenerate src/client from the server's openapi.json
yarn size-check   # main-bundle ceiling (1800 kB) — run it AFTER a build
yarn e2e:smoke    # Playwright, every route (~30 s) — safe to run in a tool call
yarn e2e:journeys # Playwright, the seven manifested journeys (~35 s)
```

`yarn generate-icon-names` points at `scripts/iconNameGenerator.js`, which does
not exist — the `scripts/` directory does, and holds `size-check.mjs`.
Vitest covers pure functions only — the configurator's (`_etc/geometry`,
`_etc/pricing`, `_etc/dimensionOps`, `_etc/products/*`, `_etc/configUrl`,
`_etc/sanitizeConfig`, `_etc/registry`) plus `views/admin/_etc/colorValue`:
186 tests across 15 files, no component tests. Take the count from
`yarn test:unit:run`, not from grepping `it(` — several specs generate cases in
a loop, so grep undercounts. `.claude/hooks/hooks.test.sh` covers the hooks
themselves.

The e2e commands are **hermetic and safe to run in a tool call** (unlike
`yarn dev`): Playwright boots its own vite on **3101** and its own Nest API on
**5055** over an in-memory mongod, so it never touches your `yarn dev` or a real
database. First run needs `npx playwright install chromium` once.

## The five-second version

- Components in `components/ui/global/` are global as `<F*>` — never import them.
- Every backend call goes through a generated service from `@/client`. There is
  no hand-written axios layer any more, and adding a global axios interceptor
  breaks the generated client.
- Toasts go through `useFToast()`, never vue-toastification's `useToast()`.
  Pass the caught error object itself — it already understands `ApiError`.
- `yarn gcl` regenerates `src/client/` from `../umit-mobilya-server/openapi.json`.
- `components.d.ts` is generated and committed; `*.tsbuildinfo` is gitignored.
  Never edit either.
- Renaming an `ERouteNames` value changes route identity everywhere.
