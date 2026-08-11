# Rule 04 — Generated code

> If a file was produced by a tool, the tool is the source of truth. Editing the output edits nothing.

## Why this rule exists

One generated file already exists here and gets hand-edited by mistake:
`components.d.ts`. It is written by `unplugin-vue-components` on every build and
opens with `/* eslint-disable */` and `// @ts-nocheck` — the plugin itself is
telling you not to treat it as source. Edits survive until the next `yarn build`,
then vanish, having polluted the diff in the meantime.

**Forward-looking:** `src/client/` does not exist yet. Phase 2 introduces OpenAPI
codegen (`openapi-typescript-codegen`) that generates a typed API client there
from the backend's `/docs-json` schema. That directory is already listed in
`eslint.config.js` ignores so it never gets linted, and it will be denied in
`.claude/settings.json` so it cannot be written by hand. This rule is written now
so the convention is in place before the code lands.

## Do

1. Treat `components.d.ts` as build output. Let `unplugin-vue-components`
   regenerate it; ignore its churn in diffs.
2. Once codegen lands, regenerate `src/client/` with the `gcl` script rather than
   touching the files.
3. Fix problems at the source. A wrong type in generated output means the backend
   schema is wrong — fix the DTO, regenerate, and the fix reaches every consumer.
4. Import generated types from `@/client` and delete the hand-written equivalent
   in `src/interfaces/` once the generated one covers it. Two copies of a type
   drift apart silently.
5. Put endpoints the schema does not describe into a separate `src/customClient/`
   layer, mirroring the shape of the generated services. Keeping them out of
   `src/client/` means a regeneration never destroys them.

## Don't

- ❌ Hand-edit `components.d.ts`.
- ❌ Hand-edit anything under `src/client/` once it exists — including "just this
  one type". The next `gcl` run overwrites it.
- ❌ Patch a generated type locally to make a component compile. That hides a
  contract mismatch that will bite the next consumer.
- ❌ Add `src/client/` files to a commit by hand-writing them. They arrive only
  from the generator.
- ❌ Mix hand-written code into the generated directory as a shortcut. That is
  what `src/customClient/` is for.

## Also generated, also committed

- `components.d.ts` — `unplugin-vue-components`
- `tsconfig.*.tsbuildinfo` — TypeScript incremental build state; churns on every
  build, never edited
- `dist/` — Vite build output; gitignored despite existing locally
