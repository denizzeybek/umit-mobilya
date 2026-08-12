# Rule 00 — TDD Discipline

> **Red → Green → Refactor** governs every new behavior. The **characterization suite** is the contract the port was measured against, and it stays as the regression net.

## Why this rule exists

This backend was plain Express + CommonJS with **zero** test files, and it was replaced domain by domain with NestJS + TypeScript. The only record of what the API did was the running code, so the behavior had to be captured before it could be replaced — which is what `test/characterization/` is.

That capture earned its cost immediately. It found a category rename that answered 400 while having already succeeded, a signup rejection that carried no reason, a gallery delete that destroyed another product's image before answering 404, and a `GET /api/products` that would have returned 500 in production the moment the category domain moved. None of those show up in a type error or a failed build.

If you only remember one thing: **a shape nobody checked against a running request is a guess.**

## The characterization suite

`test/characterization/` holds the HTTP contract of every endpoint. Those specs
were written against the Express implementation, watched go green, and then
re-run unchanged against the NestJS one — which is what turned "the port looks
right" into "the port is proven". They stay because that contract is still the
contract.

Rules for touching them:

- **Changing an assertion means changing the API.** If a spec goes red, the
  first question is what the frontend will do, not how to make the bar green.
  Every deliberate change so far is written up in the commit that made it.
- The suite pins the things that break silently: exact status codes including
  the odd ones (`GET /api/products` answers **201**), response bodies field by
  field including `null`s, which routes need auth, and the error status plus
  body on every failure path.
- `test/characterization/app-bootstrap.characterization.spec.ts` lists every
  path in the OpenAPI schema. That list is what `yarn gcl` generates the
  frontend client from, so an endpoint missing there is a method missing on the
  other side.
- They go through `test/create-test-app.ts`, which boots the app exactly the way
  `main.ts` does. Never hand-build an app in a spec — a differently-configured
  app tests something that is not deployed.

## Red → Green → Refactor (use for every new behavior)

1. **Red** — Write `*.spec.ts` before the implementation file. Run it. It must fail with a meaningful error.
2. **Green** — Write the minimum code that passes. No bonus features.
3. **Refactor** — Restructure with the green bar in place. The spec is untouched. If you need to change the spec to refactor, you are changing behavior, not refactoring.

## Tooling

- **Jest** — NestJS default, same as flexytime-be. Specs sit next to their source: `category.service.ts` → `category.service.spec.ts`.
- **Mongoose** — Use `mongodb-memory-server` when the behavior under test *is* the query (filters, population, the `modules[]` flattening). Use a mocked model when the behavior is pure logic (price totals, key building) — spinning up a database to assert arithmetic is waste.
- **R2 / S3** — Never let a test reach the real bucket. `ObjectStorageService` is injectable precisely so a spec can substitute it; the characterization suite mocks `@aws-sdk/client-s3` outright. A test that hits R2 is not a unit test, it is a bill.
- **Environment** — `test/setup-env.ts` writes deliberately fake credentials and `ConfigModule` skips `.env` when `NODE_ENV=test`. Do not reach for `process.env` inside a spec; if a value is missing, add it there.

## Do

- Write the spec file first, save it, run it, and look at the bar before writing implementation.
- Name tests by behavior: `it('returns 404 when the product id does not exist')`, not `it('getProductById works')`.
- When a regression appears, the first change is a spec that reproduces it. Only then fix.
- Land the spec and the implementation it covers in the same commit.
- Follow `src/category/` when adding a domain. It is the smallest complete example of the shape.

## Don't

- ❌ Write the implementation first and backfill the spec. `enforce-spec-first` will block the write.
- ❌ Use `it.only`, `it.skip`, `xit`, or `it.todo`. `block-skip-and-only` denies them. An untested behavior is an unshipped behavior.
- ❌ Land placeholder assertions like `expect(true).toBe(true)` or a bare `expect(result).toBeDefined()`.
- ❌ Relax a characterization assertion to make a change pass. That spec is the API contract; editing it is a decision about the frontend, and it belongs in the commit message.
- ❌ Assert on a shape you did not check against a running request. Most of the surprises in this codebase were shapes everyone assumed.

## Hook enforcement

- `enforce-spec-first` (PreToolUse on Write/Edit) — denies creating `foo.service.ts` when `foo.service.spec.ts` does not exist.
- `enforce-spec-failing` (PostToolUse on Write) — runs a **brand-new** spec and denies it if it passes on the first run. Characterization specs are exempt by filename, and an already-committed spec is exempt because adding a case to a green suite is ordinary work.
- `run-related-tests` (PostToolUse on Write/Edit) — runs the specs related to the file you just touched. It reports rather than blocks: during Red the spec is *supposed* to fail.
- `block-skip-and-only` (PreToolUse on Write/Edit) — denies `.only` / `.skip` / `xit` landing in a spec.

Related: [[05-backend-architecture]] (where code lives), [[06-validation-and-errors]] (what to assert on failure paths).
