# CLAUDE.md — server

Index only. Every rule that governs code in `umit-mobilya-server/` is defined in
`.claude/rules/`; this file points at them. Architecture lives in the root
`CLAUDE.md`.

## Rules

| File | Covers |
|---|---|
| [`00-tdd-discipline.md`](.claude/rules/00-tdd-discipline.md) | Characterization cycle for the port, Red→Green→Refactor for new behaviour, hook enforcement |
| [`05-backend-architecture.md`](.claude/rules/05-backend-architecture.md) | Controller/service/schema/DTO split, migration order, R2 object-storage rules, CORS |
| [`06-validation-and-errors.md`](.claude/rules/06-validation-and-errors.md) | DTOs + class-validator, global `ValidationPipe`, one error shape, JSDoc feeding the OpenAPI schema |
| [`07-config-and-secrets.md`](.claude/rules/07-config-and-secrets.md) | `ConfigModule` validation at boot, the nine required variables, Railway dashboard |

Repo-wide rules that also apply here: [`comment-policy.md`](../.claude/rules/comment-policy.md),
[`done-checklist.md`](../.claude/rules/done-checklist.md),
[`git-workflow.md`](../.claude/rules/git-workflow.md).

## Migration state

Moving from Express + CommonJS to **NestJS + TypeScript**, domain by domain:
`category` → `auth` → `product`. Both stacks run side by side during the move.

| Domain | State |
|---|---|
| `category` | Express — 90 lines |
| `auth` | Express — 113 lines |
| `product` | Express — 532 lines |

New endpoints go to the Nest side even when the rest of their domain has not
moved. Never add surface to the old Express controllers.

## Commands

```bash
yarn dev          # nodemon app.js — never run this in a tool call, it blocks
yarn start        # node app.js (PORT env, default 5000)
node --check <f>  # syntax gate for the remaining .js files; also a PostToolUse hook
```

Jest arrives with the NestJS skeleton. Until then there is no test command.

## The five-second version

- MongoDB stores object **keys** (`imageName`, `imageNameList[]`), never URLs.
- `GET /api/products` and `/:id` return **201**. That is current behaviour and
  the characterization specs pin it — do not "fix" it in isolation.
- Mutating routes sit behind auth. The deliberate exceptions are the whole `auth`
  domain and `POST /api/products/filter`, which uses a mutation verb to run a read.
- `modules[]` is stored as `{ productId, quantity }` and **flattened** on read
  into `{ _id, name, price, currency, imageUrl, quantity }` — the API shape is
  not the schema shape.
- The `Product.imageUrl` column is dead. `updateProduct` still writes it; every
  read path ignores it and regenerates from `imageName`.
- `migrations/` holds one-shot scripts. Nothing runs them automatically.
