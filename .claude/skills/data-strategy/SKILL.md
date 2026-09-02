---
name: data-strategy
description: When to use static as-const test data vs. Faker-generated factory data.
---

# Test Data Strategy

Test data is bifurcated by purpose — don't reach for the wrong one.

## Static (`test-data/static/*.ts`)

Immutable boundary/invalid/known-catalog values that are the same on every
run and every environment. Written as TypeScript with `as const`, **never**
`.json` — JSON can't be type-checked and doesn't get IDE/compiler help.
Blocked by the hook for anything under `test-data/static/`.

Use static data for:

- Invalid-input cases (`INVALID_CREDENTIALS`, `INVALID_ISBN_VALUES`).
- Fixed catalog/reference data that the system under test seeds itself
  (`CATALOG_BOOKS` — demoqa's book catalog doesn't change).

```typescript
export const INVALID_ISBN_VALUES = ['', 'not-an-isbn', '0000000000000'] as const;
```

## Factory (`test-data/factories/*.ts`)

Dynamic, unique-per-run data generated with `@faker-js/faker`. Use for
happy-path data where reusing the same value across runs/workers would
cause collisions (usernames, emails) or mask isolation bugs.

```typescript
export function generateUser(): GeneratedUser {
    const userName = `${faker.internet.username()}_${faker.string.alphanumeric(6)}`;
    return { userName, password: /* ... */ };
}
```

A factory function returns fresh data on every call — never a module-level
constant. If a test needs the _same_ generated value twice, generate once
and pass it around; don't call the factory twice expecting equal output.

## Decision rule

Ask: "if this value were different tomorrow, would the test still be
testing the same thing?" If yes → factory. If no (you're specifically
testing what happens with _this_ boundary value, or referencing a fixed
real-world catalog entry) → static.
