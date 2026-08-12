# Rule 08 — Testing patterns

> A test earns its keep by failing when the behaviour breaks. Everything else in a spec file is decoration.

## Why this rule exists

The suite went from zero to 195 specs in one migration, and it found eleven real
bugs on the way — a rename that answered 400 after succeeding, an image delete
that destroyed the wrong object, a `GET /api/products` that would have returned
500 in production. None of those were caught by types or by the build.

They were caught because the specs asserted *observable behaviour* against a
real database and a real HTTP layer. Specs that assert against mocks of the code
under test would have passed happily through every one of them.

## Where a spec lives

| Kind | Location | Boots |
|---|---|---|
| Unit | next to its source — `category.service.spec.ts` | nothing, or an in-memory mongod |
| HTTP contract | `test/characterization/*.characterization.spec.ts` | the whole app via `createTestApp()` |

There is no third category. If you are reaching for one, you probably want an
HTTP spec.

## Do

1. **Name the behaviour, not the method.**
   `it('responds 404 when the id matches nothing')`, never
   `it('remove works')`. The name is what someone reads in a failure report at
   the worst possible moment.
2. **One behaviour per `it`.** Two assertions about the same behaviour is fine —
   status and body belong together. Two behaviours means two tests, because you
   want to know which one broke.
3. **Arrange with a helper, assert inline.** `seedProduct({ price: 250 })` at the
   top, expectations written out in full below. A shared assertion helper hides
   the thing the reader came to see.
4. **Assert the whole shape when the shape is the contract.** `toEqual` with
   `expect.objectContaining` beats three `toBeDefined` calls; the point of an
   HTTP spec is to notice a field appearing or vanishing.
5. **Test the failure paths.** Status *and* message, because the frontend puts
   that message on screen. Half of what the characterization suite protects is
   error behaviour.
6. **Pin the surprises explicitly, with a comment saying they are surprising.**
   `GET /api/products` answering 201 looks like a typo to every reader; the spec
   says it is not.
7. **Reproduce a bug as a failing spec before fixing it.** That spec is the only
   evidence the fix works, and the only thing stopping it coming back.

## Don't

- ❌ `expect(result).toBeDefined()` or `expect(true).toBe(true)`. They pass for
  the wrong reasons and never fail for the right one.
- ❌ Assert on a shape you have not seen a real response produce. Most of the
  surprises in this codebase were shapes everyone assumed.
- ❌ Share mutable state between tests. `clearCollections()` runs in
  `beforeEach` for a reason — and note it asks the *server* what collections
  exist, because a version that iterated registered models silently cleared
  nothing.
- ❌ Depend on test order, or on documents another test created.
- ❌ Write a spec whose only failure mode is "someone renamed a method".
- ❌ Use `it.only`, `it.skip`, `xit`. `block-skip-and-only` denies them.

## The harness

- `test/global-setup.ts` starts one mongod for the whole run; each worker gets
  its own database inside it.
- `test/setup-env.ts` writes deliberately fake credentials **before any module
  is imported** — `ConfigModule.forRoot()` validates the environment while the
  `@Module` decorator is evaluated, so setting them in `beforeAll` is too late.
- `test/create-test-app.ts` boots the app exactly as `main.ts` does, and syncs
  indexes. Without that sync a duplicate-email spec sees 201 sometimes and 400
  other times, which is the worst kind of failure.
- Never hand-build an app inside a spec. A differently-configured app tests
  something that is not deployed.

Related: [[00-tdd-discipline]] (when to write which cycle),
[[09-mocking-discipline]] (what to substitute), [[12-coverage-gates]].
