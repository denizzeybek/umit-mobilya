# Rule 07 — Config and secrets

> A missing environment variable should stop the process at boot, not surface as `undefined` inside an S3 call three hours later.

## Why this rule exists

Today every variable is read as a bare `process.env.X` with no default and no
startup check, and `dotenv.config()` is called in **two** places (`app.js` and
`controllers/product.controller.js`). Nothing validates that the nine required
variables are present.

The failure mode this produces is specific and nasty: a missing
`PUBLIC_BUCKET_URL` does not throw. It yields image URLs like `/some-key.jpg` —
relative paths that look almost right, render as broken images, and send you
hunting through the frontend for a bug that is in the backend's environment.

Neither host reads variables from the repo. Server variables live in the
**Railway dashboard**; client `VITE_*` variables live in the **Netlify
dashboard**. Adding one to `.env` locally and stopping there ships a broken
deploy.

## Required variables

`MONGO_URI`, `JWT_SECRET`, `PORT`, `ALLOWED_ORIGINS`, `BUCKET_NAME`,
`S3_ENDPOINT`, `PUBLIC_BUCKET_URL`, `ACCESS_KEY`, `SECRET_ACCESS_KEY`.

`ALLOWED_ORIGINS` is comma-separated and defaults to `http://localhost:3001`.
Adding a deploy domain is a Railway variable change, not a code change.

## Do

- Register `ConfigModule.forRoot({ isGlobal: true, validationSchema })` once in
  `AppModule` and let a missing or malformed variable fail the boot. The whole
  point of moving to Nest is that this becomes one line instead of nine checks.
- Read configuration through injected `ConfigService`, so a test can substitute
  values without touching `process.env`.
- Add every new variable to `.env.example` with a placeholder in the same commit
  that introduces it, and say in the commit body that the Railway dashboard needs
  it too.
- Keep `.env` out of git. It is gitignored and write-protected in
  `.claude/settings.json`; leave it that way.

## Don't

- ❌ Read `process.env` directly from a service or controller. That is the habit
  this rule exists to end, and it is untestable.
- ❌ Call `dotenv.config()` from more than one place. `ConfigModule` replaces it
  entirely.
- ❌ Give a secret a fallback default. A default for `JWT_SECRET` means the app
  boots happily with a token signing key that anyone reading the repo knows.
  Non-secret values (`PORT`, `ALLOWED_ORIGINS`) may have defaults.
- ❌ Commit a real credential to `.env.example`. Placeholder only.

## Hook enforcement

`enforce-no-direct-env` (PreToolUse on Write/Edit) denies `process.env` anywhere
under `src/` except `config/`, `main.ts`, `setup-app.ts`, `tools/` and specs.
Those five are the places where reading the environment directly is the job;
everywhere else it is a value no test can substitute.

`NODE_ENV` is allowed everywhere, and it is a genuine exception rather than a
convenience: it decides how `ConfigModule` itself loads, so it has to be
readable before the container exists. It is also not a secret.

Related: [[05-backend-architecture]] (where R2 config is consumed),
[[06-validation-and-errors]] (request-level validation, a different layer),
[[11-logging]] (never log what this protects).
