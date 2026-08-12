# Rule 11 — Logging

> A log line is written once and read at 3am. Write it for the reader, not for yourself today.

## Why this rule exists

The Express version logged with bare `console.log`, and what survived was
`console.log('test be')` sitting in the product list endpoint on production, plus
`console.log(err.message, err.code)` inside the auth error handler — printing
user emails and failure reasons to stdout on every failed login.

There is no log aggregator here. Railway keeps stdout, and that is the whole
observability story, so the signal-to-noise ratio of these lines *is* the tooling.

## Do

1. **Use Nest's `Logger`**, one per class, named after the class:
   ```ts
   private readonly logger = new Logger(ObjectStorageService.name);
   ```
   The class name is the only context you get in a Railway log; without it every
   line is anonymous.
2. **Log what was swallowed.** `ObjectStorageService.remove()` deliberately
   ignores storage failures so an outage cannot block a database delete — that
   trade is only acceptable because the key and the reason are logged. Every
   swallowed error needs the same treatment.
3. **Log 5xx with the stack, 4xx not at all.** `AllExceptionsFilter` does this:
   a 404 is the system working, and logging it buries the 500 that matters.
4. **Include the identifier you would search by** — the object key, the route,
   the id. "Silme başarısız" without the key is a line you cannot act on.
5. **Let the exception filter do the reporting.** A service that catches, logs
   and rethrows produces the same failure twice in the log.

## Don't

- ❌ `console.log`. Ever. It has no level, no context and no way to be silenced.
- ❌ Log credentials, tokens, password hashes, or full request bodies. The auth
  path in particular: an email plus "incorrect password" in a log is a
  credential-stuffing report for whoever reads it.
- ❌ Leave a debugging line behind. `'test be'` shipped to production and stayed
  there; nobody noticed because nobody reads a log that is full of noise.
- ❌ Log inside a hot read path. `GET /api/products` is called on every page
  load.
- ❌ Log an expected outcome. A 404 for a missing product is not an event.

## Levels

| Level | For |
|---|---|
| `error` | The request failed and the cause is ours. Include the stack. |
| `warn` | Degraded but handled — a swallowed storage failure, a retried call. |
| `log` | Lifecycle only: boot, shutdown, a migration running. |
| `debug` | Local investigation. Should not survive the commit. |

Related: [[06-validation-and-errors]] (the filter that logs 5xx),
[[07-config-and-secrets]] (never log what it protects).
