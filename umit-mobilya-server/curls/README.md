# curls/

Replay-ready calls for every endpoint this API serves. One script, one request,
one readable response.

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

Scripts are committed executable. If git dropped the bit:

```bash
chmod +x curls/*/*.sh curls/_shared/*.sh
```

## What needs real R2 credentials

`products/create.sh` and `products/upload-images.sh` push to Cloudflare R2. With
placeholder credentials they answer **500** and the log shows a TLS handshake
failure — the script is fine, the bucket is not reachable. Everything else runs
against a local MongoDB with no object storage at all.

To exercise the module and gallery endpoints without R2, seed products straight
into Mongo and use their ids; the read, module and delete paths never touch the
bucket on the happy path (deletion failures are logged and swallowed by design).

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
products/add-module.sh        POST /api/products/add-module
products/remove-module.sh     DELETE /api/products/remove-module/:productId/:moduleId
products/update-modules.sh    PUT  /api/products/update-modules/:id
schema.sh                     GET  /docs-json               (what `yarn gcl` reads)
```

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
