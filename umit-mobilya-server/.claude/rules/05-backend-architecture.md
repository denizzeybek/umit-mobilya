# Rule 05 — Backend Architecture

> NestJS + TypeScript, all three domains ported. The rules below are what the port bought; keeping them is what stops the service sliding back.

## Why this rule exists

The Express version put everything in the controller: HTTP handling, business logic, database queries, and S3 calls all live in the same function. `product.controller.js` reached 532 lines that way. Nothing could be tested without booting the whole app, and nothing could be reused without copying it.

The Nest structure exists to split those responsibilities so each one can be tested alone. The migration is only worth its cost if we actually take that split — porting a 532-line controller into a 532-line Nest controller buys nothing.

## Structure

`src/category/` is the reference domain — `schemas/`, `dto/`, service,
controller, module, with a spec beside the service and the controller and the
HTTP contract pinned in `test/characterization/`. Copy that shape.

Shared pieces, reuse rather than reimplement:

| Piece | Where | For |
|---|---|---|
| `JwtAuthGuard` | `src/auth/guards/` | Every mutating route. `AuthModule` is `@Global()`, so it resolves without an import. |
| `ParseObjectIdPipe` | `src/common/pipes/` | Every `:id` param. Without it a malformed id reaches mongoose and surfaces as 500. |
| `AllExceptionsFilter` | `src/common/filters/` | The single error body. |
| `ObjectStorageService` | `src/storage/` | The only place that talks to R2. |

## Layers

- **Controller** — HTTP only: route, params, DTO in, response out. No queries, no S3, no branching business rules.
- **Service** — the logic. Injectable, unit-testable without HTTP.
- **Schema** — Mongoose model defined with `@Schema()` / `@Prop()` classes. The class is both the schema and the TypeScript type, so the two cannot drift apart. This is the main reason the current `models/*.js` files are worth converting.
- **DTO** — request and response shapes, with class-validator decorators. See [[06-validation-and-errors]].

## Do

- Add a new domain as a full set: `module` + `controller` + `service` + `dto` + `schema`, then **register the module in `AppModule`**. A module that is not registered is silently dead — nothing errors, the routes just do not exist.
- Declare specific routes before parameterised ones. Nest matches in declaration order, so `@Put('create-images/:id')` below `@Put(':id')` never runs.
- Annotate a `@Body()` parameter with the DTO class itself. `Dto | undefined` makes Nest resolve the metatype to `Object` and the global `ValidationPipe` stops validating that endpoint without saying so. Use a default value when the body is optional.
- Keep controllers thin enough that reading one tells you the whole HTTP surface of the domain.
- Put shared behavior in a service and inject it. Do not import one controller from another.
- Guard every mutating endpoint. The current rule, which must survive the port: `GET` endpoints are public, `POST`/`PUT`/`DELETE` sit behind auth. The deliberate exceptions today are the whole `auth` domain (`/signup`, `/login`, `/logout`, `/me`) and `POST /api/products/filter`, which uses a mutation verb to run a read. Anything else that ships unguarded is a security hole, not a shortcut.
- Write the characterization spec before porting a file ([[00-tdd-discipline]]).

## Don't

- ❌ Put a query or an S3 call in a controller. That is what made the old 532-line controller untestable.
- ❌ Query the database from a controller.
- ❌ Forget the `AppModule` registration. Nothing errors; the routes just do not exist.
- ❌ Reach into another domain's schema directly. Go through its service.

## Object storage rules (unchanged by the migration)

These held before the port and hold after it. They live in `product.controller.js` today and move to a product service:

- **MongoDB stores keys, never URLs.** `imageName` and `imageNameList[]` hold R2 object keys. Public URLs are derived at read time from `PUBLIC_BUCKET_URL`.
- **Keys are built by `buildImageKey()`**, which slugifies the original filename and appends random hex. Keys end up inside public URLs, so they must be URL-safe — never build a key by hand.
- **`generateImageUrl()` is synchronous** and just joins the public base with the encoded key. There is no signing and no expiry; the bucket is public. URLs are stable and may be cached.
- **Deleting a record deletes the object**, and **membership is checked before anything is deleted**. A new delete path that skips either leaves orphaned objects, or destroys an object it did not own.
- **Validate before you upload.** `create` checks the category exists first; the reverse order leaves an object in the bucket on every rejected request.
- **Uploads stay in memory** — `multer.memoryStorage()` → `sharp` resize → `PutObjectCommand`. Nothing touches local disk.
- Deletion failures are logged and swallowed so a storage outage cannot block a database delete. Keep that ordering.

## CORS

Allowed origins come from the `ALLOWED_ORIGINS` environment variable, comma-separated. Adding a deploy domain is a config change, not a code change — do not reintroduce a hardcoded array.

Related: [[00-tdd-discipline]], [[06-validation-and-errors]], [[07-config-and-secrets]].
