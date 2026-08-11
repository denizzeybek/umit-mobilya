# Rule 02 — API layer and stores

> A promise wrapper around a promise adds a failure mode and nothing else.

## Why this rule exists

Every store action in this codebase is written as
`return new Promise((resolve, reject) => { axios….then(resolve).catch(reject) })`.
There are **17 of them** (`products.ts` 11, `categories.ts` 4, `auth.ts` 1,
`users.ts` 1). The wrapper does exactly what `async/await` does, except it also
loses the stack trace and makes the return type unknowable — which is why the
same files need `as unknown as` casts to put the type back.

The **17 endpoint strings** are inline at their call sites, so renaming a route
means grepping for a template literal. And `isLoading` is re-declared per view,
so every screen re-implements the same three lines of state.

The target shape is the one `flexytime-fe` uses: options-API store,
`async/await`, `try/finally`, a `loading` flag on state, and a typed return.

**This rule supersedes the older guidance** that said to keep the `new Promise`
shape for internal consistency. Consistency with a bad pattern is not a reason
to reproduce it; new actions use the shape below.

## Do

1. Write actions as `async` functions with `await`. Let rejections propagate —
   the caller decides how to surface them.
2. Track request state on the store (`loading`, `saving`) and reset it in
   `finally`, so an exception cannot leave a spinner running forever.
3. Declare the action's return type explicitly (`Promise<IProduct[]>`). If you
   need a cast to satisfy it, the type is wrong — fix the type.
4. Keep endpoint paths in one module and import them, rather than inlining
   template literals at call sites.
5. Assemble `FormData` **inside the store action**, not in the component
   (`stores/products.ts` → `create`, `createImages`). The component only holds
   the `File`.
6. After a successful mutation, refetch through the store rather than mutating
   the local list in the component.
7. Surface failures with `useFToast().showErrorMessage`.

## Don't

- ❌ Wrap `axios` in `new Promise((resolve, reject) => …)`.
- ❌ Read `response.data` inside an action. The interceptor
  (`plugins/axios.ts`) already returned the body on success.
- ❌ Assume the same about errors. The interceptor unwraps **successful**
  responses only; it rejects the raw `AxiosError`, so `error.response.data.message`
  is the correct path on the error branch. Both shapes below are right:
  - `showErrorMessage(error)` — `useFToast` reads `error?.body?.message ?? error?.message`
  - `showErrorMessage(error?.response?.data?.message)` — for API failures
- ❌ Register a store with a bare string id; use `EStoreNames`.
- ❌ Cache `imageUrl` / `imageUrlList` as if you owned them. They are permanent
  public R2 URLs composed from the object key on every read, so holding them
  across views is safe — but they are derived values. Never send them back as
  the source of truth.

## Example

```ts
// ❌ Current shape — wrapper adds nothing, forces a cast
async fetch() {
  return new Promise((resolve, reject) => {
    axios.get('/categories')
      .then((response) => {
        this.list = response as unknown as ICategory[];
        resolve(response);
      })
      .catch(reject);
  });
}

// ✅ Target shape
async fetch(): Promise<ICategory[]> {
  this.loading = true;
  try {
    const categories = await axios.get<ICategory[]>(ENDPOINTS.categories.list);
    this.list = categories;
    return categories;
  } finally {
    this.loading = false;
  }
}
```
