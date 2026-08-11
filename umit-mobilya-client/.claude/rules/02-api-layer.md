# Rule 02 — API layer and stores

> There is exactly one way to reach the backend: a service from `@/client`. If you are writing a URL string, you are doing it wrong.

## Why this rule exists

The old layer was a hand-written axios wrapper: 17 endpoint strings inlined at
their call sites, 17 `new Promise((resolve, reject) => axios….then(resolve))`
wrappers that did what `async/await` already does, and `as unknown as` casts to
put back the types the wrappers had erased. The hand-written interfaces those
casts pointed at had drifted from the API — `imageUrl` was typed `string` while
the backend could return `null`.

All of it is gone. `src/client/` is generated from the backend's OpenAPI schema,
so the request shape, the response shape and the docstring all come from the
same place the server defines them ([[04-generated-code]]).

One thing that layer left behind is worth remembering: `plugins/axios.ts` used
to install a global `response => response.data` interceptor. The generated
client uses the same global axios instance and reads `response.status`, so that
interceptor made every successful request throw
`Generic Error: status: unknown` — a request the network tab showed as 200.
**Never add a global axios interceptor.**

## Do

1. Call a generated service: `CategoriesService.categoryControllerFindAll()`.
   Never assemble a URL.
2. Write actions as `async` functions with `await`. Let rejections propagate —
   the caller decides how to surface them.
3. Track request state on the store (`loading`, `saving`) and reset it in
   `finally`, so an exception cannot leave a spinner running forever.
4. Type state and returns with the generated DTOs (`ProductResponseDto`,
   `CategoryResponseDto`). If you need a cast, the schema is wrong — fix the
   DTO on the server and regenerate.
5. Configure the client only in `src/plugins/apiClient.ts` (`OpenAPI.BASE`,
   `OpenAPI.TOKEN`, `OpenAPI.HEADERS`).
6. Pass a `File`/`Blob` straight into the generated multipart parameter. The
   client builds the FormData; the component only holds the file.
7. After a successful mutation, refetch through the store rather than mutating
   the local list in the component.
8. Surface failures with `useFToast().showErrorMessage(error)` — pass the error
   object itself.

## Don't

- ❌ Import `axios` outside `src/client/`.
- ❌ Add a global axios interceptor. See above; it breaks the generated client
  in a way that looks like a server error.
- ❌ Wrap a client call in `new Promise((resolve, reject) => …)`.
- ❌ Read `error.response.data.message` at a call site. The generated client
  rejects with an `ApiError` whose `.body` holds the server's
  `{ statusCode, message, path }`; `showErrorMessage` already knows this.
  Reaching for the axios shape produces an empty toast.
- ❌ Register a store with a bare string id; use `EStoreNames`.
- ❌ Cache `imageUrl` / `imageUrlList` as if you owned them. They are permanent
  public R2 URLs composed from the object key on every read, so holding them
  across views is safe — but they are derived values. Never send them back as
  the source of truth, and note the generated type says `string | null`
  because the server means it.

## Example

```ts
async fetch(): Promise<CategoryResponseDto[]> {
  this.loading = true;
  try {
    this.list = await CategoriesService.categoryControllerFindAll();
    return this.list;
  } finally {
    this.loading = false;
  }
}
```
