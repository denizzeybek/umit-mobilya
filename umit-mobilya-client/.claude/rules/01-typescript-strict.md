# Rule 01 — TypeScript strictness

> The compiler cannot protect you from a type you told it to stop checking. Every `any` is a hole you dug yourself.

## Why this rule exists

`tsconfig.app.json:16` sets `noImplicitAny: false`. The base config
(`@vue/tsconfig/tsconfig.dom.json`) turns `strict` on, and that one line takes
the most valuable check back out. The result is measurable: **44 `any`
occurrences** and **5 `as unknown as` casts** across `src/`.

This is **technical debt, not a licence to write untyped code.** The flag stays
`false` only until Phase 2 — once OpenAPI codegen lands, the generated types
replace most of the casts and the flag gets flipped. Until then ESLint's
`@typescript-eslint/no-explicit-any` (currently `warn`) is the only guard, and
it only catches *explicit* `any`, not inferred ones.

Do not add to the pile. Every new `any` makes the Phase 2 flip more expensive.

## Do

1. Type new code fully. If you cannot name a type, that is a signal the shape is
   unclear — go read the API response rather than reaching for `any`.
2. When `any` is genuinely unavoidable, write a `// reason:` comment on the line
   immediately above it explaining why. This is the only accepted escape and a
   hook enforces it.
3. Name prop and emit interfaces `IProps` / `IEmits`, declared inline above the
   `defineProps` / `defineEmits` call — never imported from elsewhere.
4. Register store ids through `EStoreNames` and route names through
   `ERouteNames` instead of bare string literals, so typos surface at compile
   time.
5. Prefer widening a shared interface in `src/interfaces/` over casting at the
   call site. The interfaces already drift from the API; casting hides the drift
   instead of recording it.

## Don't

- ❌ Add `any` without an immediately-preceding `// reason:` line.
- ❌ Use `as unknown as X`. All five current uses exist to contradict a type the
  code already knows is wrong — four of them
  (`stores/categories.ts:26`, `stores/products.ts:47,61,74`) exist purely to
  re-type what the axios interceptor returned. Codegen is the real fix; adding a
  sixth is not.
- ❌ Write `as unknown as any` (`plugins/i18n.ts:26`). This is a double escape
  and defeats both checks at once.
- ❌ Re-enable `noImplicitAny: false` reasoning to justify new untyped
  parameters. Implicit `any` is tolerated in *existing* code, not invited into
  new code.
- ❌ Silence a type error with `@ts-ignore`. Use `@ts-expect-error` with a
  reason, so it fails loudly once the underlying problem is fixed.

## Example

```ts
// ❌ Contradicts the interceptor's return type instead of typing it
this.list = response as unknown as IProduct[];

// ✅ Type the action's return so the cast is unnecessary
async fetch(): Promise<IProduct[]> {
  const products = await api.get<IProduct[]>('/products');
  this.list = products;
  return products;
}
```

```ts
// ✅ The only accepted form of `any`
// reason: vue-i18n's locale ref is typed as readonly in legacy mode
(i18n.global.locale as any).value = locale;
```
