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

Repo-wide rules that also apply here: [`comment-policy.md`](../.claude/rules/comment-policy.md),
[`done-checklist.md`](../.claude/rules/done-checklist.md),
[`git-workflow.md`](../.claude/rules/git-workflow.md).

## Commands

```bash
yarn dev          # vite on port 3001 — never run this in a tool call, it blocks
yarn lint         # eslint flat config; must be clean before a change is done
yarn type-check   # vue-tsc --noEmit
yarn build        # vue-tsc -b && vite build
yarn test:unit    # vitest
yarn format       # prettier --write src/
yarn gcl          # regenerate src/client from the server's openapi.json
```

`yarn generate-icon-names` points at a `scripts/` directory that does not exist.
No test files exist yet, though vitest + jsdom are configured.

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
