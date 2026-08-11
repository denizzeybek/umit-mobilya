# Rule 06 — Validation and Errors

> Nothing reaches a service until it has been through a DTO. Nothing leaves as an error except in one shape.

## Why this rule exists

Two measured facts about the Express version:

**No input is validated.** `req.body`, `req.params` and `req.query` are destructured directly in **22 places** across the controllers, and there is no validation library installed at all — no joi, no zod, no express-validator, no celebrate. The only check anywhere is Mongoose's `isEmail` on the user schema, which runs at the database layer, long after the request has been trusted. A request with a missing field, a string where a number belongs, or an extra field nobody expected goes straight through.

**Errors come back in three different shapes.** Across the 4xx/5xx responses: `{ message }` appears 24 times, `{ errors }` twice, `{ error }` twice. A client cannot write one error handler; it has to know all three. Success bodies are inconsistent too — some return `{ message }`, auth returns `{ user, token }`, the rest return bare documents or arrays.

Both problems disappear as a side effect of doing NestJS properly, which is a large part of why the migration is worth doing.

## Target state

- **DTO classes** carry the request shape, decorated with class-validator.
- **A global `ValidationPipe`** enforces them:
  ```ts
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  ```
  `whitelist` strips unknown fields, `forbidNonWhitelisted` rejects requests that carry them, `transform` turns the plain payload into an instance of the DTO class with the right primitive types.
- **A global exception filter** produces one error body for every failure path.

## Do

- Define a DTO for every endpoint that accepts input, and type the handler parameter with it.
- Put the validation on the DTO, not in the service. The service should be able to trust what it receives.
- Write a JSDoc comment on each DTO property. The `@nestjs/swagger` CLI plugin runs with `introspectComments`, so those comments become the field descriptions in the generated OpenAPI schema — and from there, in the frontend's generated client. A vague comment here becomes a vague type on the other side.
- Use precise validators. `@IsMongoId()` for an id, `@IsInt() @Min(0)` for a price, `@MaxLength()` on anything that reaches the database.
- Throw Nest's built-in exceptions (`NotFoundException`, `UnauthorizedException`, `BadRequestException`) and let the filter format them.
- Preserve today's status codes when porting, including the surprising ones — `GET /api/products` returns 201 right now, and a characterization spec should pin that before anything moves ([[00-tdd-discipline]]).

## Don't

- ❌ Destructure `req.body` in a controller. If you are reaching for the raw request, the DTO is missing.
- ❌ Write `@ApiProperty()` by hand. The CLI plugin derives the schema from the class-validator decorators and the property types; adding it manually is noise that will drift. The one standing exception is a type the plugin genuinely cannot express — `(string | null)[]` in `ProductResponseDto.imageUrlList` comes out as `Record<string, any>` without help. If you add another, say in a comment what the plugin got wrong.
- ❌ Invent a fourth error shape. If a failure does not fit the standard body, that is a conversation about the body, not a place for a one-off.
- ❌ Validate inside a service "just to be safe". Duplicated validation drifts, and the second copy is always the stale one.
- ❌ Return raw Mongoose documents where a response DTO belongs — internal fields leak that way.
- ❌ Let a validation failure fall through to a 500. Bad input is a 400.

## Example

```ts
export class CreateCategoryDto {
  /** Display name shown in the category list. Must be unique. */
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  readonly name!: string;
}
```

That single class gives you: request validation, a typed handler parameter, an OpenAPI schema entry with a real description, and a matching type in the frontend client after `yarn gcl`. One definition, four payoffs. That is the whole argument for this rule.

Response shapes need the same treatment, in `*-response.dto.ts`. Without a
class the plugin has nothing to describe, and the generated client types that
endpoint as `any` — which quietly removes the reason the migration happened.
Annotate the handler with `@ApiOkResponse({ type: X })` / `@ApiCreatedResponse`;
the return type alone is not enough, because interfaces do not survive to
runtime.

Related: [[05-backend-architecture]] (where DTOs live), [[00-tdd-discipline]] (pinning status codes before the port).
