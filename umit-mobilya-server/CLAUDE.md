# CLAUDE.md — umit-mobilya-server

Rules for writing code in this directory. For the overall architecture see the root `CLAUDE.md`.

## Do / Don't quick reference

| ✅ Do | ❌ Don't |
|---|---|
| Put `requireAuth` on every `POST`/`PUT`/`DELETE` route | Ship a write endpoint without it — only `/login`, `/signup`, `/logout`, `/filter` are legitimately public |
| Store S3 **keys** in Mongo (`imageName`, `imageNameList[]`) | Persist a presigned URL — it expires in 1 hour and rots in the DB |
| Delete from S3 with `DeleteObjectCommand` when removing an image | Clear only the DB field — that orphans the S3 object forever |
| Add every new frontend origin to `allowedOrigins` in `app.js` | Assume CORS just works — the list is hardcoded, not env-driven |
| Run `yarn install` on EC2 after adding a dependency | Add a package and push — CI only rsyncs, so the service crashes on restart |
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

## S3 / images

7. **Never write an S3 URL to MongoDB** — store keys only: `imageName` (single image) and `imageNameList[]` (gallery).
8. On the read path, keys are converted by `generateImageUrl()` into **presigned URLs valid for 1 hour**. These URLs are ephemeral: don't write them to the DB, don't cache them, don't carry them anywhere outside the response.
9. Uploads arrive as **buffers** via `multer.memoryStorage()` and are never written to disk. The buffer is resized with `sharp(...).resize({ height: 600, width: 900, fit: 'inside' }).toBuffer()` and then sent to S3 via `PutObjectCommand`.
10. S3 keys are generated with the pattern `` `${originalname.split('.')[0]}-${randomImageName()}` `` (`crypto.randomBytes(32).toString('hex')`). Keep that pattern.
11. When deleting an image, delete it from S3 too (`DeleteObjectCommand`) — clearing the DB field alone leaves an orphaned object.

## Product `modules[]`

12. The schema stores only `{ productId: ObjectId(ref 'Product'), quantity }` in `modules[]`. On the read path `modules.productId` (and its `category`) is populated and **flattened** into `{ _id, name, price, currency, imageUrl, quantity }` — meaning **the API shape differs from the schema shape**. Don't skip that transformation when writing a new read endpoint.

## CORS

13. A new frontend origin (domain, new S3 bucket, different port) must be added to the **hardcoded `allowedOrigins` array** in `app.js`, otherwise the request is rejected at CORS.

## Dependencies and deploy

14. If you add a dependency: backend CI (`.github/workflows/backend.yaml`) **does not run `install`** — it only rsyncs and runs `systemctl restart myapp.service`. A new package requires a manual `yarn install` on EC2, otherwise the service crashes after deploy.
15. Every push to `main` triggers a production deploy. `.env` is excluded from the rsync; a new env variable must be added by hand to the `.env` on EC2.

## Best practices

16. **Keep model business logic in the schema.** `models/user.model.js` puts password hashing in a `userSchema.pre('save')` hook and credential checking in `userSchema.statics.login`, which throws `Error('incorrect email')` / `Error('incorrect password')`. Follow that shape rather than scattering bcrypt calls through controllers — and note that the `pre('save')` hook re-hashes on **every** save, so avoid calling `save()` on a user document for unrelated field updates.
17. **Translate errors in one place.** `auth.controller.js` funnels every failure through `handleErrors(err)`, which maps Mongo duplicate-key (`err.code === 11000`) and Mongoose validation errors (`Object.values(err.errors)` → `properties.path` / `properties.message`) into a flat `{ email, password }` object. Extend that function instead of inlining error branches in each handler.
18. **Keep the two token channels in sync.** `createToken(id)` signs with `expiresIn: maxAge` where `maxAge = 3 * 24 * 60 * 60` (seconds), and every auth endpoint sets both an `httpOnly` cookie (`maxAge * 1000`, milliseconds) *and* returns the token in the JSON body. If you add an auth endpoint, set both — the client stores the body token in `localStorage` while middleware may read either.
19. **Build queries with conditional spread.** `getProducts()` composes its filter as `{ ...(id && { _id: id }), ...(name && { name: new RegExp(name, 'i') }), ...(category && { category }) }` so absent filters contribute no keys. Reuse this instead of branching `if` chains — and note `name` is matched as a case-insensitive regex, not an exact match.
20. **Populate deeply, then resolve URLs in parallel.** Reads chain `.populate({ path: 'modules.productId', populate: { path: 'category' } })` with `.populate('category')`, then wrap every `generateImageUrl()` call in `Promise.all` (nested: once for `imageNameList`, once for `modules`). Presigning is a network round trip per key — never `await` them in a sequential loop.
21. **Multer is configured in the route file, not the controller.** `routes/product.route.js` builds `multer({ storage: multer.memoryStorage() })` and applies `upload.single('image')` or `upload.array('image', 20)` per route. **Trap:** the gallery route uses `upload.array('image', 20)` — the field name stays **singular `image`**, so the client must append multiple files under the same `image` key.
22. **Env vars fail silently.** `dotenv.config()` is called in both `app.js` and `controllers/product.controller.js`. Variables are read as bare `process.env.X` with no defaults and no startup validation, so a missing one surfaces as `undefined` deep inside an AWS or JWT call rather than at boot. Double-check the name against the EC2 `.env` when adding one.

## Common pitfalls

23. **Unmounted router** — `routes/<x>.route.js` exists but is missing from `routes/index.js`. Every request 404s with no error anywhere.
24. **Write endpoint without `requireAuth`** — silently public. The convention hook in `.claude/settings.json` warns about this, but it only warns; it does not block.
25. **S3 URL written to the DB** — the `Product` schema still carries a legacy `imageUrl` field that `updateProduct` writes (`product.imageUrl = imageUrl ?? product.imageUrl`), while every read path ignores it and regenerates from `imageName`. Treat that field as dead: don't read it, don't add new writers to it.
26. **Orphaned S3 objects** — deleting a product or image without a matching `DeleteObjectCommand` leaves files in the bucket that nothing references.
27. **Deploy crash from a new dependency** — CI never installs, so the first restart after adding a package fails with `MODULE_NOT_FOUND` until you `yarn install` on the box.
28. **Missing CORS origin** — a new frontend host not in `allowedOrigins` fails in the browser only; Postman and curl (no `Origin` header) still succeed, which makes it look like a frontend bug.
29. **Inconsistent success codes** — `getAllProducts` and `getProductById` respond `201` to a `GET`. Existing behaviour; match the surrounding file rather than "fixing" it in isolation, since the client may depend on it.

## Other

30. There is **no test infrastructure** — `yarn test` intentionally errors. To verify a change use `node --check <file>` (syntax) or call the endpoint by hand.
31. `.env` and `node_modules` are write-protected (see `.claude/settings.json`).
32. `migrations/` holds one-shot scripts; nothing runs them automatically — trigger them manually with `node migrations/<x>.js`.
33. Don't run `yarn dev` / `yarn start` in a tool call — both block in the foreground.
