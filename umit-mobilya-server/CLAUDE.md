# CLAUDE.md — server

Index only. Every rule that governs code in `umit-mobilya-server/` is defined in
`.claude/rules/`; this file points at them. Architecture lives in the root
`CLAUDE.md`.

## Rules

| File | Covers |
|---|---|
| [`00-tdd-discipline.md`](.claude/rules/00-tdd-discipline.md) | Red→Green→Refactor, the characterization suite, hook enforcement |
| [`05-backend-architecture.md`](.claude/rules/05-backend-architecture.md) | Controller/service/schema/DTO split, R2 object-storage rules, CORS |
| [`06-validation-and-errors.md`](.claude/rules/06-validation-and-errors.md) | DTOs + class-validator, global `ValidationPipe`, one error shape, JSDoc feeding the OpenAPI schema |
| [`07-config-and-secrets.md`](.claude/rules/07-config-and-secrets.md) | `ConfigModule` validation at boot, the nine required variables, Railway dashboard |
| [`08-testing-patterns.md`](.claude/rules/08-testing-patterns.md) | Where a spec lives, how to name it, what to assert, the shared harness |
| [`09-mocking-discipline.md`](.claude/rules/09-mocking-discipline.md) | Never mock the database, always mock R2, when a collaborator double is honest |
| [`10-mongoose-schema-rules.md`](.claude/rules/10-mongoose-schema-rules.md) | `@Schema()` classes, refs vs embedded, idempotent hooks, keys not URLs |
| [`11-logging.md`](.claude/rules/11-logging.md) | Nest `Logger`, log what you swallow, never log credentials |
| [`12-coverage-gates.md`](.claude/rules/12-coverage-gates.md) | Where the thresholds are, what is excluded and why, how to raise them |
| [`13-price-net.md`](.claude/rules/13-price-net.md) | The frozen price goldens: determinism, `yarn price-net:bless`, mutations through HTTP, self-cleaning scenarios, how a net spec is written |

Repo-wide rules that also apply here: [`comment-policy.md`](../.claude/rules/comment-policy.md),
[`done-checklist.md`](../.claude/rules/done-checklist.md),
[`git-workflow.md`](../.claude/rules/git-workflow.md).

## Layout

NestJS + TypeScript, single application. The Express/CommonJS version is gone —
all three domains are ported and no `.js` source remains.

```
curls/               replay-ready calls: auth, categories, products, schema
                     (price book / quote / storage have none) — see its README
src/
  main.ts            entry point; boots Nest and applies setup-app
  setup-app.ts       body parsers, ValidationPipe, exception filter, CORS, Swagger
  app.module.ts      ConfigModule + MongooseModule + ThrottlerModule (APP_GUARD)
                     + the feature modules
  auth/              signup, login, logout, me — plus the global JwtAuthGuard
  category/          the reference domain: schema, dto, service, controller
  configurator/      price book + the price engine copied from the client
  quote/             quote requests, the frozen price, the PDF
  product/           the portfolio: R2 images, filtering
  storage/           ObjectStorageService — the only place that talks to R2 —
                     plus LocalDiskStorage and the controller serving it
  common/            AllExceptionsFilter, ParseObjectIdPipe
  config/            env.validation.ts — the boot-time environment schema
  openapi.ts         the document builder shared by /docs and yarn schema:dump
  tools/             build-time scripts (dump-openapi); excluded from coverage
test/                shared harness + the characterization suite
  price-net/         frozen price goldens; the crown jewel — see rule 13
  pricing-sync.spec.ts  proves the two copies of the price engine are identical
  e2e-api.ts         hermetic boot for the client's Playwright suite
```

## Commands

```bash
yarn dev          # nest start --watch — never run this in a tool call, it blocks
yarn start        # node dist/main (PORT env, default 5000)
yarn build        # nest build
yarn type-check   # tsc --noEmit, strict
yarn test         # jest
yarn test:cov     # jest + coverage thresholds
yarn schema:dump  # nest build && write openapi.json (no database needed)
yarn sync:pricing # copy the price engine from the client into src/configurator/generated

yarn e2e:api          # boot the whole app on mongodb-memory-server, port 5055.
                      # What the client's Playwright suite starts; blocks, so
                      # don't run it in a tool call unless you background it.
yarn price-net:bless  # regenerate test/price-net/__goldens__ — then READ THE DIFF
```

Specs run against an in-memory mongod (`test/global-setup.ts`) with deliberately
fake credentials (`test/setup-env.ts`), and `ConfigModule` skips `.env` when
`NODE_ENV=test`. No spec can reach the real cluster or the real bucket.

## The five-second version

- MongoDB stores object **keys** (`imageName`, `imageNameList[]`), never URLs.
  `ObjectStorageService` composes public URLs at read time.
- The bucket is **optional**, and what happens without it depends on `NODE_ENV`.
  Outside production the service falls back to `LocalDiskStorage` and serves the
  files back through `GET /api/storage/:key`, so image work is possible with no
  R2 account. Under `NODE_ENV=production` it warns once and image upload answers
  **503** — Railway's disk is ephemeral, so a local-disk upload there would
  vanish on the next deploy. Everything else works in both cases.
  Half-configured storage fails the boot on purpose. Storage is R2 despite the
  `S3_ENDPOINT` name.
- `GET /api/products` and `/:id` return **201**. Inherited behaviour, pinned by
  the characterization suite — do not "fix" it in isolation.
- Mutating routes sit behind `JwtAuthGuard`. The deliberate exceptions are the
  whole `auth` domain and `POST /api/products/filter`, which uses a mutation
  verb to run a read.
- `ThrottlerGuard` is registered globally as `APP_GUARD`: 300/min per IP, and
  5/min on the public `POST /api/quotes`. Tests disable it via `THROTTLE_SKIP`
  — DI overrides do not reach a guard living under `APP_GUARD`.
- A product carries no `price`, `quantity` or `modules[]` any more. Made-to-measure
  work is priced from dimensions, so the portfolio links to the configurator and
  everything routes to a quote.
- The quote amount is computed **on the server** and frozen into the record with
  the parts list and `priceBookVersion`. A `price` in the request body is
  rejected, not ignored.
- Errors always come back as `{ statusCode, message, path, errors? }`.
- A `@Body()` parameter must be annotated with the DTO itself. Writing
  `Dto | undefined` makes Nest resolve the metatype to `Object`, and the global
  `ValidationPipe` then silently stops validating that endpoint. Use a default
  (`dto: FilterDto = {}`) when the body is optional.
- Route declaration order matters: `create-images/:id` has to be declared before
  `:id`, or `:id` swallows it.
