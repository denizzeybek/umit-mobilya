# CLAUDE.md — umit-mobilya-server

Rules for writing code in this directory. For the overall architecture see the root `CLAUDE.md`.

## Do / Don't quick reference

| ✅ Do | ❌ Don't |
|---|---|
| Put `requireAuth` on every `POST`/`PUT`/`DELETE` route | Ship a write endpoint without it — only `/login`, `/signup`, `/logout`, `/filter` are legitimately public |
| Store object **keys** in Mongo (`imageName`, `imageNameList[]`) | Persist a full image URL — it is derived from `PUBLIC_BUCKET_URL` and rots the day that domain changes |
| Build keys with `buildImageKey()` | Concatenate the raw filename — the key becomes part of a public URL |
| Delete from R2 with `DeleteObjectCommand` when removing an image or product | Clear only the DB field — that orphans the object forever |
| Add new frontend origins to the `ALLOWED_ORIGINS` env var | Hardcode them in `app.js` — the array is now env-driven |
| Configure `S3Client` with `region: 'auto'` + `endpoint` | Set an AWS-style region — R2 requires `auto` and its own endpoint |
| Mount every new router in `routes/index.js` | Create `x.route.js` and stop — an unmounted router is silently dead |
| Use CommonJS (`require` / `module.exports`) | Use `import`/`export` — there is no build step or ESM support here |
| Return `res.status(4xx\|500).json({ message })` on error | Let an exception escape the controller — there is no error middleware |
| Flatten `modules[]` on read the way `getProducts()` does | Return the raw schema shape — the API contract is the flattened one |
| Verify with `node --check <file>` | Rely on tests — there is no test infrastructure |

## Language and module system

1. **Use CommonJS** — `require()` / `module.exports` (or `exports.fn = ...`). There is no TypeScript, no ESM (`import`/`export`) and no build step in this directory; `.js` files run directly under Node.
2. Existing files use `async/await` + `try/catch` and respond with `res.status(4xx|500).json({ message, error })` on failure. Write new controllers the same way.

## Adding a new domain

3. Follow the triple: `routes/<x>.route.js` + `controllers/<x>.controller.js` + `models/<x>.model.js`. Then **don't forget** to mount it in `routes/index.js` with `router.use('/api/<x>', <x>Routes)` — an unmounted router stays silently dead.
4. Controllers are exposed as named exports (`exports.getX = ...`); the route file imports them via destructuring.

## Auth

5. **Add `requireAuth` to every mutating route** (`middleware/auth.middleware.js`). The established rule: `GET` endpoints are public, `POST`/`PUT`/`DELETE` endpoints sit behind `requireAuth`. Opening a new write endpoint without the middleware is a silent security hole.
6. `requireAuth` reads the `Authorization: Bearer <token>` header; `checkUser` reads the `jwt` cookie. Don't mix the two up.

## R2 / images

Storage is **Cloudflare R2**, driven through the S3-compatible `@aws-sdk/client-s3`. The bucket is **public**; there is no presigning anywhere in this codebase.

7. **Never write an image URL to MongoDB** — store keys only: `imageName` (single image) and `imageNameList[]` (gallery). The URL is composed at read time, so a bucket or domain change needs no data migration.
8. `generateImageUrl()` is **synchronous** and returns `` `${PUBLIC_BUCKET_URL}/${encodeURIComponent(key)}` ``, or `null` for a missing key. The URLs are permanent and cacheable — unlike the old signed links, they may be cached by the browser and CDN. `encodeURIComponent` is required because keys can still contain characters that are unsafe in a URL.
9. `S3Client` must be constructed with `region: 'auto'` and `endpoint: process.env.S3_ENDPOINT`. R2 rejects AWS region names, and without the endpoint the SDK silently talks to AWS instead.
10. Uploads arrive as **buffers** via `multer.memoryStorage()` and are never written to disk. The buffer is resized with `sharp(...).resize({ height: 600, width: 900, fit: 'inside' }).toBuffer()` and then sent with `PutObjectCommand`.
11. Keys are produced by **`buildImageKey(originalname)`**, which slugifies the filename stem (NFKD normalize → non-`\w.-` runs to `-` → lowercase, falling back to `image`) and appends `randomImageName()` (`crypto.randomBytes(32).toString('hex')`). Use it instead of hand-building keys: the key ends up inside a public URL, so spaces and Turkish characters must not survive.
12. When removing an image, delete it from R2 too (`DeleteObjectCommand`). `deleteProduct` already sweeps `imageName` plus every entry of `imageNameList`, and deliberately swallows per-object failures (logging them) so a storage error can't block the product deletion.

## Product `modules[]`

13. The schema stores only `{ productId: ObjectId(ref 'Product'), quantity }` in `modules[]`. On the read path `modules.productId` (and its `category`) is populated and **flattened** into `{ _id, name, price, currency, imageUrl, quantity }` — meaning **the API shape differs from the schema shape**. Don't skip that transformation when writing a new read endpoint.

## CORS

14. Allowed origins come from the **`ALLOWED_ORIGINS`** env var, comma-separated, defaulting to `http://localhost:3001`. Adding a deploy domain is a Railway variable change, not a code change. Requests with no `Origin` header (Postman, curl) are always allowed.

## Deploy

15. The backend runs on **Railway**, deployed from git — there are no GitHub Actions workflows in this repo. Railway installs dependencies on every deploy, so adding a package needs nothing beyond committing `package.json`.
16. Railway must be pointed at **`umit-mobilya-server` as the root directory**; this is a monorepo and the server has no Dockerfile, so Nixpacks detects the Node app from that folder. `start` (`node app.js`) is the entry command, and `app.js` already honours the injected `PORT`.
17. Environment variables live in the Railway dashboard, not in a file on the box. Current set: `MONGO_URI`, `JWT_SECRET`, `PORT`, `ALLOWED_ORIGINS`, `BUCKET_NAME`, `ACCESS_KEY`, `SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `PUBLIC_BUCKET_URL`.

## Best practices

18. **Keep model business logic in the schema.** `models/user.model.js` puts password hashing in a `userSchema.pre('save')` hook and credential checking in `userSchema.statics.login`, which throws `Error('incorrect email')` / `Error('incorrect password')`. Follow that shape rather than scattering bcrypt calls through controllers — and note that the `pre('save')` hook re-hashes on **every** save, so avoid calling `save()` on a user document for unrelated field updates.
19. **Translate errors in one place.** `auth.controller.js` funnels every failure through `handleErrors(err)`, which maps Mongo duplicate-key (`err.code === 11000`) and Mongoose validation errors (`Object.values(err.errors)` → `properties.path` / `properties.message`) into a flat `{ email, password }` object. Extend that function instead of inlining error branches in each handler.
20. **Keep the two token channels in sync.** `createToken(id)` signs with `expiresIn: maxAge` where `maxAge = 3 * 24 * 60 * 60` (seconds), and every auth endpoint sets both an `httpOnly` cookie (`maxAge * 1000`, milliseconds) *and* returns the token in the JSON body. If you add an auth endpoint, set both — the client stores the body token in `localStorage` while middleware may read either.
21. **Build queries with conditional spread.** `getProducts()` composes its filter as `{ ...(id && { _id: id }), ...(name && { name: new RegExp(name, 'i') }), ...(category && { category }) }` so absent filters contribute no keys. Reuse this instead of branching `if` chains — and note `name` is matched as a case-insensitive regex, not an exact match.
22. **Populate deeply, then map plainly.** Reads chain `.populate({ path: 'modules.productId', populate: { path: 'category' } })` with `.populate('category')`, then build the response with plain synchronous `.map()`. There is no `Promise.all` in that path any more — URL building is string concatenation, so don't reintroduce `async` callbacks around `generateImageUrl()`.
23. **Multer is configured in the route file, not the controller.** `routes/product.route.js` builds `multer({ storage: multer.memoryStorage() })` and applies `upload.single('image')` or `upload.array('image', 20)` per route. **Trap:** the gallery route uses `upload.array('image', 20)` — the field name stays **singular `image`**, so the client must append multiple files under the same `image` key.
24. **Env vars fail silently.** `dotenv.config()` is called in both `app.js` and `controllers/product.controller.js`. Variables are read as bare `process.env.X` with no defaults and no startup validation, so a missing one surfaces as `undefined` deep inside an R2 or JWT call rather than at boot. A missing `PUBLIC_BUCKET_URL` is the nastiest case: it yields URLs like `/key` that look almost right. Check the name against the Railway variables when adding one.

## Common pitfalls

25. **Unmounted router** — `routes/<x>.route.js` exists but is missing from `routes/index.js`. Every request 404s with no error anywhere.
26. **Write endpoint without `requireAuth`** — silently public. The convention hook in `.claude/settings.json` warns about this, but it only warns; it does not block.
27. **The legacy `imageUrl` column** — the `Product` schema still carries an `imageUrl` field that `updateProduct` writes (`product.imageUrl = imageUrl ?? product.imageUrl`), while every read path ignores it and regenerates from `imageName`. Treat that field as dead: don't read it, don't add new writers to it.
28. **Orphaned objects** — `deleteProduct` and `deleteImage` both clean up R2 now, but any *new* delete path you add must do the same or it will leave unreferenced files in the bucket.
29. **Missing CORS origin** — a host absent from `ALLOWED_ORIGINS` fails in the browser only; Postman and curl (no `Origin` header) still succeed, which makes it look like a frontend bug. The rejection currently surfaces as a `500`, not a `403`.
30. **Inconsistent success codes** — `getAllProducts` and `getProductById` respond `201` to a `GET`. Existing behaviour; match the surrounding file rather than "fixing" it in isolation, since the client may depend on it.

## Other

31. There is **no test infrastructure** — `yarn test` intentionally errors. To verify a change use `node --check <file>` (syntax) or call the endpoint by hand.
32. `.env` and `node_modules` are write-protected (see `.claude/settings.json`).
33. `migrations/` holds one-shot scripts; nothing runs them automatically — trigger them manually with `node migrations/<x>.js`.
34. Don't run `yarn dev` / `yarn start` in a tool call — both block in the foreground.
