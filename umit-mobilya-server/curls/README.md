# curls/

Replay-ready calls for this API. One script, one request, one readable response.

**Coverage is partial**, and knowing where the edge is saves you looking for a
script that was never written: `auth/`, `categories/` and `products/` are
covered, plus `schema.sh`. The **price book**, **quote** and **storage**
endpoints have none — reach for `curls/schema.sh` (or `/docs`) for their shapes,
and add a script here when you next work on one.

## Why this folder exists

"Did the product filter regress?" should be one command, not an archaeology dig
through a chat transcript to re-derive the body shape. The characterization
suite proves the contract in CI-less isolation; these scripts let you *look* at
it against a running server, with real data, in a second.

They are also the fastest way to hand someone else a reproduction.

## Prereqs

The server running on `:3000` against a reachable MongoDB:

```bash
cd umit-mobilya-server
yarn build && node dist/main       # or: yarn dev
```

**Mind the port.** `main.ts` defaults to **5000** when `PORT` is unset, but
`.env.example` sets `PORT=3000` and every script here — plus the client's
`yarn gcl:live` — assumes 3000. Copy `.env.example` and they agree; run with no
`.env` and every script answers "connection refused" against a server that is
running perfectly well on 5000. Override with `API_BASE` rather than editing the
scripts.

Scripts are committed executable. If git dropped the bit:

```bash
chmod +x curls/*/*.sh curls/_shared/*.sh
```

## What needs real R2 credentials

`products/create.sh` and `products/upload-images.sh` are the only scripts that
touch object storage, and what they do depends on how storage is configured:

- **Placeholder R2 credentials** — the worst case. The service believes it has a
  bucket, so it tries R2 and answers **500** with a TLS handshake failure in the
  log. The script is fine; the bucket is not reachable.
- **No R2 variables at all** — outside production the server falls back to local
  disk, so both scripts *succeed* and the returned `imageUrl` points at
  `GET /api/storage/:key` on the same server. This is usually what you want
  locally.

Everything else runs against a local MongoDB with no object storage at all.

To exercise the gallery endpoints without any storage, seed products straight
into Mongo and use their ids; the read and delete paths never touch the bucket on
the happy path (deletion failures are logged and swallowed by design).

## Env vars

| Var | Default | Notes |
|---|---|---|
| `API_BASE` | `http://localhost:3000` | No trailing slash |
| `EMAIL` | `smoke@test.local` | Created by `auth/signup.sh` |
| `PASSWORD` | `secret123` | Minimum length is 6 |

## The token

Anything that mutates needs a Bearer token. `_shared/token.sh` logs in and
caches the token in `/tmp/umit-mobilya-jwt` for an hour, so you are not
re-authenticating on every call:

```bash
./curls/_shared/token.sh          # prints the token, refreshing if stale
```

Every mutating script sources it automatically. To start clean:

```bash
rm -f /tmp/umit-mobilya-jwt
```

## Layout

```
_shared/token.sh              login + cache
auth/signup.sh                POST /api/auth/signup
auth/login.sh                 POST /api/auth/login   (raw, prints everything)
auth/me.sh                    GET  /api/auth/me
categories/list.sh            GET  /api/categories
categories/filter.sh          GET  /api/categories/filter   (body on a GET)
categories/create.sh          POST /api/categories
categories/update.sh          PUT  /api/categories/:id
categories/delete.sh          DELETE /api/categories/:id
products/list.sh              GET  /api/products            (answers 201)
products/get.sh               GET  /api/products/:id        (answers 201)
products/filter.sh            POST /api/products/filter
products/create.sh            POST /api/products            (multipart)
products/update.sh            PUT  /api/products/:id
products/delete.sh            DELETE /api/products/:id
products/upload-images.sh     PUT  /api/products/create-images/:id
products/delete-image.sh      POST /api/products/delete-image/:id
schema.sh                     GET  /docs-json               (what `yarn gcl` reads)
```

The three `*-module.sh` scripts that used to sit here are gone with the endpoints
they called. A product carries no `modules[]` any more — made-to-measure work is
priced from dimensions by the configurator, so the module system it duplicated
was removed rather than kept in parallel.

## Things these scripts will show you

- `GET /api/products` and `/api/products/:id` answer **201**, not 200. Inherited
  behaviour, pinned by the characterization suite.
- `GET /api/categories/filter` reads its criteria from the **body of a GET**.
- `POST /api/products/filter` is a POST that performs a read, and it is public.
- Product uploads send every gallery file under the **singular** field `image`.
- Errors always come back as `{ statusCode, message, path, errors? }`.

## Adding one

Copy the closest neighbour. Keep it to a single request, print the status with
`-w "\n[HTTP %{http_code}]\n"`, and take arguments positionally with sane
defaults so it runs with no arguments at all.
