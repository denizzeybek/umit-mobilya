# Rule 05 — Forms and tables

> Every form in this app is vee-validate + yup, and every field is wired by a single `name` prop. Deviating means re-implementing validation that already works.

## Why this rule exists

The `F*` wrappers in `src/components/ui/global/` bind themselves with
`useField(() => props.name)`. That one line is why passing `name="price"` is the
entire wiring — no `v-model`, no manual error plumbing, no `:invalid` binding.
Someone who does not know this reaches for `v-model` out of habit, ends up with
two sources of truth for the field, and then "fixes" it by disabling validation.

The same applies to tables: `DataTable` is configured identically in every list
view, and the two filtering strategies in play (client-side via `FilterMatchMode`,
server-side via a watched `ref`) are not interchangeable — one hits the network
on every keystroke and the other does not.

## Forms

1. Build forms with `useForm({ validationSchema })`, where the schema is a yup
   `object({...})`. Destructure only what you use — the codebase takes
   `handleSubmit`, `isSubmitting`, `resetForm`, and `defineField` when a field is
   not wrapped by an `F*` component.
2. Wire submission as `<form @submit="submitHandler">` with
   `const submitHandler = handleSubmit(async (values) => {...})`.
3. Give every yup field a `.label('Türkçe Etiket')`. That label is what appears
   inside the validation message the user reads.
4. Bind submit buttons to both `:disabled="isSubmitting"` and
   `:loading="isSubmitting"`.
5. Pass `name` to an `F*` input and stop there. See [[03-vue-components]] for the
   modal shape these forms live inside.

## Tables

6. Use PrimeVue `DataTable` with the established defaults: `paginator`,
   `:rows="20"`, `:rowsPerPageOptions="[5, 10, 20, 50]"`, a `filters` ref built
   from `FilterMatchMode` (from `@primevue/core/api`), and `:globalFilterFields`.
   `views/categories/_views/CategoriesList.vue` is the reference.
7. For **server-side** filtering instead, keep local `ref`s for the criteria and
   `watch([...], filterFn)` — the store action posts to `/products/filter`.
   `ProductsList.vue` is the reference. Don't mix the two strategies in one view.
8. Track request state on the store, not with a per-view `isLoading` ref — see
   [[02-api-layer]]. Surface failures through `useFToast()`.

## Don't

- ❌ Add `v-model` to an `F*` input that already has `name`.
- ❌ Omit `.label()` from a yup field — the message then names the raw key.
- ❌ Validate in the submit handler. If the rule is not in the schema, it is not
  a rule.
- ❌ Copy a `DataTable` config that drops `paginator` or the rows options; the
  lists here are unbounded.
