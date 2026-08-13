# Ümit Mobilya

Made-to-measure furniture for Ümit Mobilya (Kuşadası): a public site where a
customer configures a wardrobe to their own dimensions, sees it in 3D, sees the
price update as they change it, and requests a quote — plus a small admin side
for the price book and the incoming quotes.

Nothing is sold on the site. There is no basket and no payment: every path ends
in a **quote request**, because a made-to-measure price cannot be a fixed number
on a product page.

## What is actually here

- **Configurator** (`/tasarla/:product`) — the main feature. Wardrobe and
  coat-rack today. Pick dimensions, sections, material, finish, doors and back
  panel; the 3D scene and the price both update from the same parts list. The
  design encodes into the URL, so a configuration can be shared as a link.
- **Portfolio** (`/products`, `/product-details/:id`) — past work with photos.
  No prices; every product links through to the configurator or a quote.
- **Quote flow** — the customer submits a design and gets a quote record with a
  code and a PDF. The amount is computed **on the server** and frozen into the
  record, so changing the price book later never moves a quote already given.
- **Admin** (`/admin/fiyat-kitabi`, `/admin/teklifler`, `/categories`) — publish
  a new price book version, read incoming quotes, manage categories.

## Stack

**Client** — Vue 3 + TypeScript, Vite, Pinia, Vue Router, PrimeVue + Tailwind,
Three.js for the 3D viewer, vee-validate + yup for forms. The API layer is
**generated** from the server's OpenAPI schema; there is no hand-written HTTP
code.

**Server** — **NestJS** + TypeScript (strict) + Mongoose. The earlier
Express/CommonJS version is gone; no `.js` source file remains. JWT auth,
global validation pipe, one error shape, rate limiting, Swagger at `/docs`.

**Storage** — Cloudflare R2 via `@aws-sdk/client-s3` (R2 speaks the S3 API).
MongoDB stores object *keys*, never URLs. Without R2 credentials the server
falls back to local disk outside production, so the app is runnable with no
cloud account.

**Database** — MongoDB (Atlas in the intended deployment).

## The load-bearing invariant

**The price on screen and the price stored on the quote are the same number.**

The price engine is duplicated on purpose — the client needs it so the panel
updates without a round trip, the server needs it so the amount on a quote is
never the client's claim. `yarn sync:pricing` copies it and
`test/pricing-sync.spec.ts` proves the two copies are byte-identical. Frozen
"price net" goldens prove the numbers are right, and a Playwright journey proves
the wiring between them.

## Layout

Two independent apps in one repository, each with its own `package.json` and
lockfile. There is no workspace tooling — install in each.

```
umit-mobilya-client/   Vue 3 + Vite SPA        (yarn)
umit-mobilya-server/   NestJS REST API         (yarn)
netlify.toml           frontend build config; Netlify only reads it from the root
```

## Running it

Prerequisites: **Node 22** (what every gate is run on) and yarn 1. A MongoDB
instance for the server — or none at all, if you only run its tests, which use
an in-memory mongod.

```bash
cd umit-mobilya-server && yarn install && yarn dev    # http://localhost:5000
cd umit-mobilya-client && yarn install && yarn dev    # http://localhost:3001
```

Both apps need a `.env`, which is gitignored. The server ships an annotated
`.env.example` — copy it. Only `MONGO_URI` and `JWT_SECRET` are genuinely
required; the R2 five are all-or-nothing and may be omitted entirely.

Before your first Playwright run: `npx playwright install chromium`.

## Testing

There is **no CI**. Every gate is local, which makes them load-bearing rather
than optional — see [`.claude/rules/done-checklist.md`](.claude/rules/done-checklist.md)
for the list to run before calling something done.

| Question | Layer |
|---|---|
| Is this arithmetic right? | client vitest, pure functions |
| Does this design still cost the same? | server price-net goldens |
| Is the HTTP contract intact? | server characterization suite |
| Do the two price engines still match? | `pricing-sync.spec.ts` |
| Does every screen still load? | Playwright smoke |
| Does the wiring hold in a real browser? | Playwright journeys |

A number is asserted on the server, never in the browser.

## Documentation

[`CLAUDE.md`](CLAUDE.md) is the architecture document and the entry point —
it explains how the pieces fit and why the non-obvious ones are that way. The
rules that govern how code is written live in `.claude/rules/`, indexed from
there and from each app's own `CLAUDE.md`.

## Deployment

**Nothing is deployed right now.** The intended setup is Netlify (frontend),
Railway (backend), Cloudflare R2 (images) and MongoDB Atlas — the config for it
is in the repo, but no host is connected, so a push publishes code and nothing
more. See the Deployment section of `CLAUDE.md` before wiring one up.

## License

Private project. No licence is granted; there is no `LICENSE` file.
