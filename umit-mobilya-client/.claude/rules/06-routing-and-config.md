# Rule 06 — Routing, storage and config

> Three things in this app look like labels but are identities: route names, storage keys, and env var names. Changing one as if it were copy breaks something silently.

## Why this rule exists

`ERouteNames` values are **Turkish display strings** used simultaneously as the
route `name`, `meta.title`, and the sidebar label. A "copy tweak" to one of them
breaks every `router.push({ name: ... })` that referenced it — with no compile
error, because the value is still a valid string.

`public/_redirects` looks like a stray extensionless file. Deleting it breaks
every deep link and page refresh in production while leaving `yarn dev` perfectly
happy, because the Vite dev server has its own history fallback. The failure only
appears after deploy.

And a `VITE_*` variable that exists locally but not in the Netlify dashboard
builds fine and ships `undefined`.

## Routing

1. Grep before renaming an `ERouteNames` value. It is route identity, title and
   nav label at once.
2. The router guard in `src/router/index.ts` restores the session from
   `localStorage` (`EStorageKeys.TOKEN`) via `usersStore.fetchUser` before every
   navigation. It does **not** set any auth header: `OpenAPI.TOKEN` in
   `src/plugins/apiClient.ts` reads the token from localStorage per request.
   Don't add a second mechanism.
3. Anything touching the guard gets opened in a browser before it is called done.
   An infinite-redirect bug shipped from this file once and `type-check` was
   green throughout. See [[done-checklist]].

## Storage

4. Reach `localStorage` only through `EStorageKeys` from `@/constants/storageKeys`
   (`TOKEN`, `USER`, `AUTHENTICATION`). Bare string keys drift from the enum and
   end up reading something nobody writes.

## Config and env

5. Adding a `VITE_*` variable means **three** places: the local `.env`, the
   `env.d.ts` typing if it is referenced, and the **Netlify dashboard**. There is
   no CI workflow writing `.env` any more.
   `VITE_API_URL` ends with `/api`; `apiClient.ts` strips that suffix because the
   generated paths already carry it. One variable serves both.
6. `netlify.toml` lives at the **repo root**, not in this folder — Netlify only
   reads it from the repository root. It carries `base = "umit-mobilya-client"`,
   `command = "yarn build"`, `publish = "dist"` (relative to `base`) and
   `NODE_VERSION = "22"` — it tracks the Node the local gates actually run on,
   so don't lower it without re-running them. Leave the Netlify UI's base directory field empty;
   setting it too nests the path twice.
7. `public/_redirects` holds the SPA fallback `/*  /index.html  200`. The router
   uses `createWebHistory`, so without it a direct visit to `/login` returns
   Netlify's 404. Vite copies `public/` into `dist/` verbatim — verify
   `dist/_redirects` exists after a build.
8. `.prettierrc.json` pins `singleQuote: true` to match the existing code.
   Without it prettier rewrites every string to double quotes. Don't delete it.

## i18n — know what is actually wired

9. `vue-i18n` is installed and configured, but there are **zero `$t()` calls** in
   `views/`, `components/` and `layouts/` — all user-facing copy is hardcoded
   Turkish. `locales/*.json` currently only backs yup validation messages.
   Adding a locale key changes nothing on screen until the template is converted
   too. Don't assume otherwise.

## Don't

- ❌ Rename an `ERouteNames` value without grepping for it.
- ❌ Read or write `localStorage` with a bare string key.
- ❌ Add a `VITE_*` var and stop at the local `.env`.
- ❌ Delete `public/_redirects`.
- ❌ Run `yarn dev` in a tool call — it blocks in the foreground.
