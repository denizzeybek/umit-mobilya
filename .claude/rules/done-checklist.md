# Done Checklist

> "It builds on my machine" is not done. Run the gates before you claim a task is finished.

## Why this rule exists

This repo has no CI. The GitHub Actions workflows were deleted when the project moved
off AWS, and Netlify/Railway only run a build — they don't type-check, lint, or test.
Every quality gate that exists is one you run locally or one a hook runs for you.

The cost of skipping them is not theoretical: an infinite-redirect bug in the router
guard shipped to `main` in this project, and `type-check` alone would not have caught
it — only opening the app did.

## Client — `umit-mobilya-client/`

Before calling a change done:

```bash
yarn lint         # must be clean; lint:fix only for mechanical fixes
yarn type-check   # vue-tsc, must pass
yarn build        # catches what type-check misses
```

For anything touching routing, auth, or rendering: **open the app and look at it.**
`yarn dev`, then visit the affected route. A blank page with a console error passes
every command above.

## Server — `umit-mobilya-server/`

The NestJS half (`src/`, `test/`):

```bash
yarn test         # Jest; the spec you wrote must be green
yarn type-check   # tsc --noEmit, strict
yarn build        # nest build
```

The not-yet-ported Express half (`routes/`, `controllers/`, `models/`):

```bash
node --check <changed-file>   # syntax gate, also enforced by a PostToolUse hook
```

A domain is only migrated when its characterization spec is green against the
**new** implementation and its line is gone from `routes/index.js`. Leaving the
legacy mount in place means the old handler still shadows the new controller —
Express middleware runs before Nest's router, and nothing errors.

## Both

- Don't commit build artefacts that changed as a side effect. `*.tsbuildinfo` churns
  on every build — restore it rather than including it in an unrelated commit.
- Don't commit `.env`. Use `.env.example` when a variable is added.
- If a check fails and you're fixing something unrelated, say so rather than silently
  leaving it broken.

## Don't

- ❌ Report a task complete while a gate is red. Say which one and why.
- ❌ Use `--no-verify` or otherwise bypass a hook to land a commit.
- ❌ Treat a passing `type-check` as proof the feature works. It proves types line up,
  nothing more.
