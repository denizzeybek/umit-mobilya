# Comment Policy

> Code says what. Types say what shape. A comment earns its place only when it says **why** — and in this repo, only in the two places where a tool reads it.

## Why this rule exists

A `PreToolUse` hook (`~/.claude/hooks/no-comment-noise.js`) blocks writes that add
non-allowlisted `//` comments. It is global, applies to every project, and cannot be
argued with mid-edit. Knowing the policy up front saves a rejected write.

The hook denies **`//` line comments** only. Block comments pass the hook — but that
is not a licence to narrate. See the JSDoc section below for where blocks are
actually wanted.

## Allowed `//` comments

The hook's allowlist, verbatim:

- `// TODO: ...`, `// FIXME: ...`, `// HACK: ...`
- `// eslint-disable*`, `// eslint-enable*`
- `// @ts-expect-error`, `// @ts-ignore`, `// @ts-nocheck`, `// @ts-check`
- `// prettier-ignore`, `// prettier-enable`
- `// c8 ignore`, `// istanbul ignore`
- `// reason: ...` — the escape hatch required directly above an unavoidable `any`
- `/// <reference ... />` in `.d.ts` files

Everything else is denied.

## JSDoc — where blocks belong

**Server (after the NestJS migration): JSDoc on DTOs is functional.** The swagger CLI
plugin runs with `introspectComments: true`, so a JSDoc line above a DTO property
becomes the field's description in the OpenAPI schema — which then flows into the
generated frontend client. There, a comment is not documentation for a human reader;
it is an input to codegen. Write it deliberately.

```ts
export class CreateProductDto {
  /** Display name shown in the catalogue. */
  @IsString()
  @MaxLength(200)
  readonly name!: string;
}
```

**Client: nothing reads JSDoc.** No plugin, no generator, no doc site. Identifiers and
types carry the meaning. Don't add `/** ... */` blocks to `.vue` or store files.

A short block comment explaining a genuinely non-obvious decision is acceptable
anywhere — but the bar is "a reader would get this wrong without it", not "this took
me a while to write".

## Do

- Delete a comment that restates the line below it. `// Calculate total price` above
  a `reduce` that calculates a total price is noise.
- Write `// reason:` as one sentence naming why the `any` is unavoidable, not as a
  freeform note.
- Give `// TODO:` a concrete trigger — what unblocks it, not just that it exists:
  `// TODO: drop this cast once @/client ships IProduct.`

## Don't

- ❌ Commented-out code. Git remembers it; you won't.
- ❌ Section banners (`// === Setup ===`). Use blank lines.
- ❌ Author or date markers (`// added by ... on ...`).
- ❌ Closing markers (`// end of function`).
- ❌ Rewriting a denied `//` as a block comment purely to slip past the hook. If it
  was noise as a line comment, it is noise as a block.
