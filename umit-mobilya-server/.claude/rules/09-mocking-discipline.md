# Rule 09 — Mocking discipline

> Mock what you cannot afford to call. Everything else, call.

## Why this rule exists

A mock is a claim that the real thing behaves a certain way. When the claim is
wrong the test still passes, which is worse than having no test — you now have
a green bar guarding nothing.

This codebase has exactly two things worth mocking, and a large category of
things that must never be mocked.

## Never mock: the database

Use the in-memory mongod. It is already running (`test/global-setup.ts`), it
costs milliseconds, and the behaviour under test in this service *is* usually
the query:

- the case-insensitive substring regex in `filter`
- `findByIdAndUpdate` returning `null` versus throwing
- `populate` walking `modules.productId` and then its `category`
- the `modules[]` flattening, which is the whole shape of the read API

A mocked model turns every one of those into "the mock returned what I told it
to". `ProductService`'s spec runs against a real database for exactly this
reason, and that is where the module-usage query bug surfaced.

## Always mock: object storage

```ts
jest.mock('@aws-sdk/client-s3', () => ({ /* record the commands */ }));
```

A spec that reaches R2 is not a unit test, it is a bill — and a flaky one, since
it depends on the network. `ObjectStorageService` is injectable precisely so it
can be substituted; the characterization suite mocks the SDK outright and
**records the commands**, which is what lets it assert *which* objects were
deleted. That assertion is how the "deletes another product's image" bug was
proved fixed.

## Mock with care: a collaborator you own

Substituting `ProductService` in the controller spec is right — the controller's
job is HTTP wiring, and the service has its own spec next door. Substituting it
in the service's own spec would be circular.

The test: **does the mock stand in for something that is verified elsewhere?**
If yes, mock it. If the mock is the only description of that behaviour anywhere,
you have written the test twice and checked neither.

## Do

- Give a mock the narrowest surface that works. A `{ findAll: jest.fn() }` is
  clearer about what the code uses than a full class double.
- Reset mocks in `beforeEach` (`jest.resetAllMocks()`), so a call count from a
  previous test cannot make the next one pass.
- Assert on the *call*, not just the result, when the call is the point:
  `expect(storage.remove).not.toHaveBeenCalled()` is the assertion that proves
  a wrong key never reached the bucket.
- Prefer a real object over a mock when constructing one is cheap. A plain
  `{ buffer, originalname, mimetype }` beats a mocked `Express.Multer.File`.

## Don't

- ❌ Mock the mongoose model to avoid starting a database. It is already started.
- ❌ Mock a method on the class under test — that is testing the mock.
- ❌ Let a mock return a shape the real thing cannot produce. If you are not
  sure what it returns, run a curl script (`curls/`) and look.
- ❌ Use `jest.mock` on a module and then forget the recorded state between
  tests. The characterization suite clears its command log in `beforeEach`.

Related: [[08-testing-patterns]], [[00-tdd-discipline]].
