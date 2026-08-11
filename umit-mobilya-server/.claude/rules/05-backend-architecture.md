# Rule 05 — Backend Architecture

> Target is NestJS + TypeScript. Getting there is domain by domain, so at any moment part of this service is Nest and part is still Express. Know which half you are standing in before you write.

## Why this rule exists

The Express version put everything in the controller: HTTP handling, business logic, database queries, and S3 calls all live in the same function. `product.controller.js` reached 532 lines that way. Nothing could be tested without booting the whole app, and nothing could be reused without copying it.

The Nest structure exists to split those responsibilities so each one can be tested alone. The migration is only worth its cost if we actually take that split — porting a 532-line controller into a 532-line Nest controller buys nothing.

## Migration status

| Domain | State | Order |
|---|---|---|
| `category` | Express (90 lines) | Migrate 1st — cheapest place to establish the pattern |
| `auth` | Express (113 lines) | Migrate 2nd — guard/strategy pattern |
| `product` | Express (532 lines) | Migrate 3rd — R2 and module logic, once the pattern is settled |

Both stacks run side by side during the move. That is expected, not a problem to fix early.

## Layers

- **Controller** — HTTP only: route, params, DTO in, response out. No queries, no S3, no branching business rules.
- **Service** — the logic. Injectable, unit-testable without HTTP.
- **Schema** — Mongoose model defined with `@Schema()` / `@Prop()` classes. The class is both the schema and the TypeScript type, so the two cannot drift apart. This is the main reason the current `models/*.js` files are worth converting.
- **DTO** — request and response shapes, with class-validator decorators. See [[06-validation-and-errors]].

## Do

- Add a new domain as a full set: `module` + `controller` + `service` + `dto` + `schema`, then **register the module in `AppModule`**. This is the direct successor to the old `routes/index.js` mount step — a module that is not registered is silently dead, exactly like an unmounted router was.
- Keep controllers thin enough that reading one tells you the whole HTTP surface of the domain.
- Put shared behavior in a service and inject it. Do not import one controller from another.
- Guard every mutating endpoint. The current rule, which must survive the port: `GET` endpoints are public, `POST`/`PUT`/`DELETE` sit behind auth. The deliberate exceptions today are the whole `auth` domain (`/signup`, `/login`, `/logout`, `/me`) and `POST /api/products/filter`, which uses a mutation verb to run a read. Anything else that ships unguarded is a security hole, not a shortcut.
- Write the characterization spec before porting a file ([[00-tdd-discipline]]).

## Don't

- ❌ Add new endpoints to the old Express controllers. New surface goes to the Nest side even if the rest of that domain has not moved yet.
- ❌ Port a controller by pasting it into a Nest controller. Split the logic into the service on the way in — that split is the point of the migration.
- ❌ Query the database from a controller.
- ❌ Forget the `AppModule` registration. Nothing errors; the routes just do not exist.
- ❌ Reach into another domain's schema directly. Go through its service.

## Object storage rules (unchanged by the migration)

These held before the port and hold after it. They live in `product.controller.js` today and move to a product service:

- **MongoDB stores keys, never URLs.** `imageName` and `imageNameList[]` hold R2 object keys. Public URLs are derived at read time from `PUBLIC_BUCKET_URL`.
- **Keys are built by `buildImageKey()`**, which slugifies the original filename and appends random hex. Keys end up inside public URLs, so they must be URL-safe — never build a key by hand.
- **`generateImageUrl()` is synchronous** and just joins the public base with the encoded key. There is no signing and no expiry; the bucket is public. URLs are stable and may be cached.
- **Deleting a record deletes the object.** `deleteProduct` and `deleteImage` both issue `DeleteObjectCommand`. A new delete path that skips this leaves orphaned objects that nothing will ever clean up.
- **Uploads stay in memory** — `multer.memoryStorage()` → `sharp` resize → `PutObjectCommand`. Nothing touches local disk.
- Deletion failures are logged and swallowed so a storage outage cannot block a database delete. Keep that ordering.

## CORS

Allowed origins come from the `ALLOWED_ORIGINS` environment variable, comma-separated. Adding a deploy domain is a config change, not a code change — do not reintroduce a hardcoded array.

Related: [[00-tdd-discipline]], [[06-validation-and-errors]].
