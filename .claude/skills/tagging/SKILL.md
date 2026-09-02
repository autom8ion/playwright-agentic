---
name: tagging
description: The six test tags, single-tag enforcement, and when @destructive applies.
---

# Tagging

Every `test(...)` call carries **exactly one** tag, passed as the options
object — never on `test.describe()`:

```typescript
test('should reject login with an unknown username', { tag: '@sanity' }, async ({ loginPage }) => {
    // ...
});
```

## The six tags (`enums/tags.ts`)

| Tag            | Meaning                                                               | Run with                                   |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------ |
| `@smoke`       | Critical path — must pass for the build to be considered alive.       | `npm run test:smoke`                       |
| `@sanity`      | Quick correctness check on one specific behavior.                     | `npm run test:sanity`                      |
| `@regression`  | Broader coverage of previously-fixed or edge-case behavior.           | `npm run test:regression`                  |
| `@e2e`         | Multi-step user journey across more than one page/feature.            | `npm run test:e2e`                         |
| `@api`         | API-only spec, no browser page involved.                              | `npm run test:api`                         |
| `@destructive` | Mutates **shared** state (not just its own created-and-cleaned data). | `npm run test:destructive` (single worker) |

## `@destructive` specifically

`@destructive` is for tests where the mutation could affect _other_ tests
running concurrently — e.g. `delete-all-books.api.spec.ts` wipes the entire
shared test user's collection, not just one book it added itself. It
overrides every other tag and always runs with `--workers 1` so it can't
race another test that expects its own fixture data to still exist.

A test that creates a book via `createdBook` and deletes only that book is
**not** destructive — it owns its data end-to-end and is safe to run
concurrently. Tag it by what it actually verifies (`@e2e`, `@smoke`, ...).

## What the hook catches

The enforcement hook blocks the literal string `'@functional'` (not a real
tag — the `tests/app/functional/` folder already implies it) and blocks passing
`tag:` to `test.describe(...)`. It does **not** verify "exactly one tag" —
that's a code-review-time rule, not mechanically cheap to check on a partial
edit.
