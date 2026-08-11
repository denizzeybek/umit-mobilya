# Git Workflow

> `main` is deployed. Branch first, verify before you push, and keep unrelated churn out of the diff.

## Why this rule exists

Pushing to `main` triggers deploys: Netlify rebuilds the frontend, Railway redeploys
the backend. There is no CI gate in between and no review step — whatever lands on
`main` goes out. A `PreToolUse` hook warns before a push to `main`, but it asks; it
does not stop you.

## Branches

- Work on a branch, never directly on `main`.
- Prefix by intent: `fix/`, `feat/`, `chore/`, `refactor/`.
- Name after the change, not the ticket: `fix/auth-store-cleanup`, not `fix/issue-12`.
- Branch from the branch you depend on. A migration that needs an unmerged bug fix
  should branch off that fix, not off `main` — otherwise you cannot test it.

## Commits

- **Turkish commit messages**, matching this repo's history.
- Subject line: what changed, imperative. Body: **why**, and what a reader would
  otherwise have to reconstruct.
- When a commit fixes a bug, state the symptom and the mechanism — the next person
  greps for the symptom.
- One concern per commit. A migration and a formatting sweep are two commits.
- Keep generated churn out: `*.tsbuildinfo` changes on every build; restore it before
  staging unless the commit is genuinely about it.

## Before pushing

Run the gates in `done-checklist.md`. Pushing a red branch wastes the next person's
bisect.

## Do

- Say plainly when a push will deploy, and to which service.
- Prefer fast-forward merges when history is linear — a merge commit for a
  single-branch project adds noise, not information.
- Delete merged branches once they're in `main`.

## Don't

- ❌ `git push --force` / `-f` on a shared branch.
- ❌ `git commit --no-verify` / `-n` to skip a hook.
- ❌ `git reset --hard` on work you haven't backed up.
- ❌ Commit `.env` or anything with a credential in it. Add it to `.env.example`
  with a placeholder instead.
- ❌ Bundle a formatting sweep into a behavioural change. The diff becomes unreadable
  and the behavioural bug hides inside 400 lines of reindentation.
