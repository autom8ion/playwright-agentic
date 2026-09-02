---
name: api-testing
description: The apiRequest fixture and Zod strictObject schema validation for API tests.
---

# API Testing

API specs live in `tests/app/api/*.api.spec.ts`, tagged `@api`. They use the
`apiRequest` fixture (never Playwright's raw `request` fixture directly, and
never a bare `fetch`) so every call goes through one typed helper:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';
import { Endpoints } from '../../../enums/endpoints';
import { BooksListResponseSchema } from '../../../test-data/schemas/book-schema';

test('should return the full catalog with a schema-valid body', { tag: '@api' }, async ({ apiRequest }) => {
    const { status, body } = await apiRequest({ method: 'GET', url: Endpoints.bookStore.books });

    expect(status).toBe(200);
    expect(BooksListResponseSchema.parse(body)).toBeTruthy();
});
```

## Schema validation

Every schema in `test-data/schemas/*.ts` uses `z.strictObject()`, never
`z.object()`. `strictObject` rejects unknown keys — if the API starts
returning an extra field, the test fails loudly instead of silently ignoring
a contract change. This is enforced by the hook for anything under
`test-data/schemas/`.

```typescript
export const BookSchema = z.strictObject({
    isbn: z.string(),
    title: z.string(),
    // ...
});
```

Call `.parse(body)` (throws with a readable diff on mismatch), not
`.safeParse(body)` followed by an unused result — a schema check that can't
fail the test isn't doing anything.

## Auth for API calls

Authenticated endpoints need a bearer token. Pull it from the `apiSession`
fixture (written once by `auth.setup.ts`, not re-derived per test) and pass
it as `token` on the `apiRequest` call:

```typescript
await apiRequest({
    method: 'POST',
    url: Endpoints.bookStore.books,
    token: apiSession.token,
    data: { userId: apiSession.userId, collectionOfIsbns: [{ isbn }] },
});
```

## Endpoints

URL paths are constants in `enums/endpoints.ts` — never inline a path string
in a test or page object.
