# Rule 10 — Mongoose schemas

> The schema class is both the database shape and the TypeScript type. That is the entire reason the models were worth converting — do not let the two drift apart again.

## Why this rule exists

The Express version defined schemas as plain objects and types nowhere, so the
only description of a document was the code that happened to read it. Two of
this project's worst bugs came straight out of that gap:

- `Product.category` is an `ObjectId` **ref**, not an embedded object.
  `category.controller.js` wrote `$set: { 'category.name': ... }` as if it were
  embedded. Every category rename answered 400 after having already saved.
- The `Product.imageUrl` column is dead. `updateProduct` kept writing to it
  while every read path composed the URL from `imageName`. Nothing failed;
  the field just quietly diverged from reality.

A `@Schema()` class makes both of those a compile error.

## Do

1. **Define the collection name explicitly**: `@Schema({ collection: 'products' })`.
   Mongoose's pluralisation is a guess, and a wrong guess silently creates an
   empty collection next to your data.
2. **Model a reference as `Types.ObjectId` with `ref`**, and remember what that
   means: the document stores an id, nothing else. There is no denormalised copy
   to keep in sync, so do not write code that tries.
3. **Give arrays a `default: []`.** Without it the field is `undefined` on old
   documents and every consumer needs a guard. `imageNameList` is the reason
   `Array.isArray` checks were scattered through the Express controller.
4. **Put a sub-document in its own `@Schema({ _id: false })` class** when it has
   no identity of its own — `ProductModuleRef` is `{ productId, quantity }` and
   an extra `_id` per entry would be noise in every response.
5. **Keep hooks idempotent.** `UserSchema.pre('save')` guards on
   `isModified('password')`; without it, saving a user to change an unrelated
   field re-hashes an already-hashed password and locks the account out.
6. **Export the document type**: `export type ProductDocument = HydratedDocument<Product>`.
   Services type the injected model as `Model<Product>` and receive
   `ProductDocument` back.
7. **Preserve the existing shape when porting.** `createdAt` here is an ordinary
   field with a default, not mongoose's `timestamps` option — switching would
   add `updatedAt` to every response and change the wire contract for nothing.

## Don't

- ❌ Store a URL. MongoDB holds object **keys** (`imageName`, `imageNameList[]`);
  URLs are composed at read time by `ObjectStorageService`, which is what keeps
  rows portable when the public domain changes.
- ❌ Denormalise a field you also reference by id. One of them will be stale and
  you will not find out from a test.
- ❌ Add a field no read path uses. That is how `imageUrl` became dead weight —
  if nothing reads it, delete it or read it.
- ❌ Reach into another domain's schema. Go through its service.
- ❌ Rely on `unique: true` without letting the index build. It is created
  asynchronously; `createTestApp()` calls `syncIndexes()` for exactly this
  reason, and a spec that skips it sees 201 where it expected 400 — sometimes.

## Validation lives in two places, deliberately

Mongoose validators (`required`, `minlength`, `isEmail`) are the last line, at
the database. class-validator DTOs are the first, at the edge
([[06-validation-and-errors]]). Both exist: the DTO gives the caller a usable
message, the schema stops a bad write from any other path.

Do not delete the schema-level validators because "the DTO already checks it" —
the DTO only covers requests.

Related: [[05-backend-architecture]], [[06-validation-and-errors]],
[[09-mocking-discipline]] (why these are tested against a real mongod).
