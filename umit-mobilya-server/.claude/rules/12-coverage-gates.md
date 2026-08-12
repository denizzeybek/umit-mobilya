# Rule 12 — Coverage gates

> Coverage is a smoke alarm, not a score. It cannot tell you the tests are good; it can tell you a file stopped being tested.

## Why this rule exists

195 specs exist today. Nothing stopped the 196th change from adding an untested
branch, and nothing would have told you — the bar stays green either way. The
threshold exists so that *sliding* is loud, which is the only thing a coverage
number is actually good at.

The numbers in `jest.config.ts` sit just below what the suite really achieves.
That is deliberate: a threshold set at the current value fires on rounding and
gets raised out of annoyance until it means nothing.

## Where the numbers are

`jest.config.ts` → `coverageThreshold`. Two path entries and a global floor.

| Scope | Bar | Why |
|---|---|---|
| `src/auth/guards/**` | 100% everything | It decides who gets in. A missed branch here is an authorisation hole. |
| `src/common/pipes/**` | 100% everything | It decides what a valid id is. A missed branch is a 500 on bad input. |
| global | 93 / 73 / 92 / 94 | statements / branches / functions / lines |

Files matched by a path entry are **removed from the global calculation** —
that is how Jest works, and it is why the global number is not simply the
overall percentage.

## Excluded from measurement

- `src/tools/**` — build tooling, run by `yarn schema:dump`, not by the app
- `src/main.ts` — bootstrap; `createTestApp()` exercises the same setup
- `src/**/*.module.ts` — wiring with no branches; counting it inflates the
  number without measuring anything

Excluding a file is a claim that nothing there can break in a way a test would
catch. Make that claim deliberately, and write down why — as above.

## Do

- Run `yarn test:cov` before opening a change that adds a branch.
- Read the per-file table, not the total. A 95% average with one service at 40%
  is worse than a flat 90%.
- Raise a threshold when coverage rises and stays there. A floor that trails
  reality by twenty points is not a floor.
- Cover the failure path. Uncovered branches in this codebase are almost always
  `catch` blocks and guard clauses — which is exactly where the bugs were.

## Don't

- ❌ Lower a threshold to make a change pass. That is the alarm working; the
  answer is a test. If the drop is genuinely justified, say so in the commit
  message rather than in a config diff nobody reads.
- ❌ Add a file to the exclusion list to avoid testing it.
- ❌ Write a test whose only purpose is to execute a line. Coverage is a
  by-product of testing behaviour; chasing it directly produces specs that
  assert nothing and still have to be maintained.
- ❌ Treat 100% as done. `src/category/**` is at 100% and its port still needed
  a characterization suite to prove the HTTP contract survived.

Related: [[08-testing-patterns]], [[09-mocking-discipline]],
[[../../.claude/rules/done-checklist]].
