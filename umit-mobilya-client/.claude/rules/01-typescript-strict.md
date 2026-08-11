# Rule 01 — TypeScript strictness

> The compiler cannot protect you from a type you told it to stop checking. Every `any` is a hole you dug yourself.

## Why this rule exists

`tsconfig.app.json` used to set `noImplicitAny: false`, which took the most
valuable check straight back out of `strict`. That line is gone. The bill for
it was 44 `any` occurrences and 5 `as unknown as` casts, and the casts existed
almost entirely to re-type what a hand-written axios layer had erased.

Generated types settled most of it: once `src/client/` arrived, only **7**
implicit `any`s were left to fix by hand. What remains is 18 *explicit* `any`s
in code that never touches the API — PrimeVue prop passthroughs, the i18n
locale ref, the global component registry. ESLint reports each as a warning.

Do not add to the pile, and never reach for `as unknown as` again: if a type
does not fit, the schema is the thing to change.

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
5. Take API types from `@/client`. There are no hand-written API interfaces
   left — they drifted, and the compiler found 25 places where they disagreed
   with the server the moment they were removed.

## Don't

- ❌ Add `any` without an immediately-preceding `// reason:` line.
- ❌ Use `as unknown as X`. Every previous use existed to contradict a type the
  code already knew was wrong. They are all gone; do not start again.
- ❌ Re-add `noImplicitAny: false`, or work around it with an annotation of
  convenience. If a parameter's type is unclear, read the generated DTO.
- ❌ Silence a type error with `@ts-ignore`. Use `@ts-expect-error` with a
  reason, so it fails loudly once the underlying problem is fixed.

## Example

```ts
// ❌ Contradicts the response type instead of typing it
this.list = response as unknown as IProduct[];

// ✅ The generated service already knows the shape
async fetch(): Promise<ProductResponseDto[]> {
  this.list = await ProductsService.productControllerFindAll();
  return this.list;
}
```

```ts
// ✅ The only accepted form of `any`
// reason: vue-i18n's locale ref is typed as readonly in legacy mode
(i18n.global.locale as any).value = locale;
```
