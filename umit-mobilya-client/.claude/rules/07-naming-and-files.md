# Rule 07 — Naming and file layout

> Half the conventions here are load-bearing: a name is an identity, a folder decides whether a component is global, a suffix decides whether a file is linted. Guessing produces code that works until it doesn't.

## Why this rule exists

Three names in this codebase are not labels:

- An `ERouteNames` value is the route `name`, the document title **and** the nav
  label at once. "Fixing the copy" breaks every `router.push({ name })` with no
  compile error, because the value is still a valid string.
- A file dropped in `components/ui/global/` becomes `<F{Filename}>` globally,
  by `import.meta.glob`. The filename *is* the component name.
- Anything under `src/client/` is generated and denied for editing. The path is
  the rule.

The project also carried a `src/types/globalComponents.d.ts` declaring 27
`R`-prefixed components, 23 of whose files did not exist — a leftover from
another project that survived because nothing checked. Names drift silently.

## Files and folders

| What | Where | Named |
|---|---|---|
| Route component | `src/views/<feature>/_views/` | `PascalCase.vue` |
| Feature-local component | `src/views/<feature>/_components/` | `PascalCase.vue` |
| Dialog | `src/views/<feature>/_modals/` | `PascalCase.vue` |
| Feature enum/helper | `src/views/<feature>/_etc/` | — |
| Global widget | `src/components/ui/global/` | `Input.vue` → `<FInput>` |
| Shared, not global | `src/components/ui/local/` | imported explicitly |
| Layout | `src/layouts/<name>/` | with its own `_components/` |
| Pinia store | `src/stores/` | `products.ts`, id from `EStoreNames` |
| Enum | `src/enums/` | `storageKeys.enum.ts` |
| Interface | `src/interfaces/` | `option.interface.ts` |
| Constant | `src/constants/` | `colors.ts` |
| Generated client | `src/client/` | never hand-written |

Those four `_`-prefixed folder names are the complete set. Do not invent a
fifth.

## Naming

1. **Enums are `E`-prefixed**, members PascalCase: `ERouteNames.ProductsList`,
   `EStorageKeys.TOKEN`, `EStoreNames.PRODUCTS`.
2. **Interfaces are `I`-prefixed**: `IProps`, `IEmits`, `IOption`. API types are
   the exception — they come from `@/client` with the server's names
   (`ProductResponseDto`) and are never renamed on the way in.
3. **Props and emits interfaces are always `IProps` / `IEmits`**, declared
   inline above the `defineProps` / `defineEmits` call, never imported.
4. **A composable is `useThing`** and lives in `src/composables/`.
5. **Boolean props read as assertions**: `hasModules`, `isEditing`,
   `onlyTitle` — not `modules`, not `edit`.
6. **A handler is `handleX` or `onX`**, consistently within a file.

## Do

- Grep before renaming an `ERouteNames` value.
- Put a new shared widget in `components/ui/global/` and use it as `<FName>` with
  no import. If it should not be global, it belongs in `ui/local/`.
- Delete a file rather than leaving it unreferenced. Six unused global
  components, three dead helpers and a stale `.d.ts` accumulated here precisely
  because nothing forced the question.
- Keep the enum and the thing it names in step: `storageKeys.enum.ts` exports
  `EStorageKeys`.

## Don't

- ❌ Rename an `ERouteNames` value as a copy change.
- ❌ Import from `components/ui/global/` explicitly — it is already registered.
- ❌ Add a `.d.ts` describing components that a plugin registers. The plugin is
  the source of truth; a hand-written declaration goes stale and lies.
- ❌ Name a file after the ticket, the date, or its author.
- ❌ Introduce a second name for a concept the API already named.

Related: [[03-vue-components]], [[04-generated-code]], [[06-routing-and-config]].
