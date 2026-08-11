# Rule 00 — TDD Discipline

> Two cycles live here. **Characterization** proves the JS→TS migration didn't change behavior. **Red → Green → Refactor** governs every new behavior. Pick the right one before you write a line.

## Why this rule exists

This backend currently runs as plain Express + CommonJS JavaScript, and it works. We are moving it to NestJS + TypeScript **domain by domain** (`category` → `auth` → `product`). The single biggest risk in that move is silent behavior drift: an endpoint that used to return `201` now returns `200`, a field that used to be `null` now goes missing, a route that was public becomes guarded.

There is no test suite today — zero spec files, no Jest, no supertest. That means the only record of what this API does is the running code itself. Before we replace that code, the behavior has to be captured somewhere it can be checked. That is what a characterization spec is for.

If you only remember one thing: **during migration the spec describes the old code, not the new one.** Write it against the Express implementation, watch it pass, then port. The spec passing after the port is the proof.

## Cycle A — Characterization (use during the JS→TS migration)

Green on first run is **expected here**, not a failure.

1. **Capture** — Write a spec against the *current* Express/JS behavior. Run it. It must be **green**, because the code already works. If it's red, your spec is wrong about what the code does — fix the spec, not the code.
2. **Port** — Move the file to NestJS + TypeScript.
3. **Prove** — Run the same spec against the new implementation. Still green = behavior preserved. Red = you changed something; revert and port again.

Name these files `*.characterization.spec.ts`. The suffix is not decorative — the hooks use it to tell them apart from normal specs, and `enforce-spec-failing` must not apply to them.

Capture the things that are easy to break silently:
- HTTP status codes exactly as they are today, including the odd ones (`GET /api/products` returns **201**, not 200 — that is current behavior, and preserving it is the point)
- Response body shape, field by field, including `null` values
- Which routes require auth and which don't
- Error status + body shape for the failure paths

## Cycle B — Red → Green → Refactor (use for every new behavior)

1. **Red** — Write `*.spec.ts` before the implementation file. Run it. It must fail with a meaningful error.
2. **Green** — Write the minimum code that passes. No bonus features.
3. **Refactor** — Restructure with the green bar in place. The spec is untouched. If you need to change the spec to refactor, you are changing behavior, not refactoring.

## Tooling

- **Jest** — NestJS default, same as flexytime-be. Specs sit next to their source: `category.service.ts` → `category.service.spec.ts`.
- **Mongoose** — Use `mongodb-memory-server` when the behavior under test *is* the query (filters, population, the `modules[]` flattening). Use a mocked model when the behavior is pure logic (price totals, key building) — spinning up a database to assert arithmetic is waste.
- **R2 / S3** — Never let a test reach the real bucket. During the port, wrap the S3 client in an injectable service so Nest can substitute it; until then use `jest.mock` on `@aws-sdk/client-s3`. A test that hits R2 is not a unit test, it is a bill.

## Do

- Write the spec file first, save it, run it, and look at the bar before writing implementation.
- Name tests by behavior: `it('returns 404 when the product id does not exist')`, not `it('getProductById works')`.
- When a regression appears, the first change is a spec that reproduces it. Only then fix.
- Land the spec and the implementation it covers in the same commit.
- Migrate in the agreed order — `category` (90 lines) first, because the pattern is cheapest to establish there, then `auth`, then `product` (532 lines).

## Don't

- ❌ Port a file to TypeScript before a characterization spec covers it. Without the spec, "it still works" is an opinion.
- ❌ Write the implementation first and backfill the spec. `enforce-spec-first` will block the write.
- ❌ Use `it.only`, `it.skip`, `xit`, or `it.todo`. `block-skip-and-only` denies them. An untested behavior is an unshipped behavior.
- ❌ Land placeholder assertions like `expect(true).toBe(true)` or a bare `expect(result).toBeDefined()`.
- ❌ Change a characterization spec to make a port pass. That spec is the contract with the old system; changing it erases the only evidence we had.
- ❌ Add new endpoints to the old Express controllers. New work goes to the NestJS side (see [[05-backend-architecture]]).

## Hook enforcement

- `enforce-spec-first` (PreToolUse on Write/Edit) — denies creating `foo.service.ts` when `foo.service.spec.ts` does not exist.
- `run-related-tests` (PostToolUse on Write/Edit) — runs the specs related to the file you just touched.
- `block-skip-and-only` (PreToolUse on Write/Edit) — denies `.only` / `.skip` / `xit` landing in a spec.

Characterization specs are exempt from the "must be red first" expectation by filename. Everything else is not.

Related: [[05-backend-architecture]] (where code lives), [[06-validation-and-errors]] (what to assert on failure paths).
