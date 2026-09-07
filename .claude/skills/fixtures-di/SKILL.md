---
name: fixtures-di
description: The layered fixture chain in fixtures/pom and why specs only ever import test-options.ts.
---

# Fixtures & Dependency Injection

Tests never construct anything (`new LoginPage(page)`, calling `fetch`
directly, reading `.auth/app/apiSession.json` themselves). Everything a test
needs arrives as a named fixture, parameter-injected by Playwright:

```typescript
import { expect, test } from '../../../fixtures/pom/test-options';

test('...', { tag: '@smoke' }, async ({ loginPage, apiRequest, apiSession }) => {
    // loginPage, apiRequest, apiSession are all fixtures — never imported or constructed directly.
});
```

## The chain

`fixtures/pom/test-options.ts` is the **only** file a spec imports from. It
re-exports `test` (and `expect`) from a chain of `base.extend(...)` layers:

```
network-fixture.ts       context override — aborts ad/analytics requests (no auto; browser tests only)
        │  base.extend
        ▼
page-object-fixture.ts   loginPage, bookStorePage, profilePage, webTablesPage, ...
        │  base.extend
        ▼
api-request-fixture.ts   apiRequest<T>(options) — typed HTTP helper
        │  base.extend
        ▼
helper-fixture.ts        apiSession, createdBook, resetStorageState
        │
        ▼
test-options.ts          re-exports { test, expect } — import this, nothing else
```

Each layer only depends on the layer(s) before it. When adding a new
fixture, decide which layer it belongs to:

- A request-level concern for every browser test (routing, headers) → `network-fixture.ts`.
- A new page object → `page-object-fixture.ts`.
- A new typed API wrapper → `api-request-fixture.ts`.
- Something built from a page object _and_ the API (setup/teardown helpers,
  derived session data) → `helper-fixture.ts`.

## Rules

- Never `import { test } from '@playwright/test'` in a spec file — import
  from `fixtures/pom/test-options` instead. The enforcement hook blocks the
  direct import in any `tests/app/**/*.spec.ts` file.
- `auth.setup.ts` is the one legitimate exception: it runs _before_ the
  authenticated session exists, so it imports the lower `page-object-fixture`
  layer directly rather than the full chain (which would try to read a
  storage-state file that doesn't exist yet).
- A fixture that creates state (`createdBook`) must clean up its own state
  after `await use(...)` — that's what makes it safe to reuse across specs.
