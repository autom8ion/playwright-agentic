---
name: auth-storage-state
description: How auth.setup.ts authenticates once and how tests reuse or opt out of that session.
---

# Auth & Storage State

Tests never log in themselves. `tests/app/auth.setup.ts` runs once, before
the `chromium` project (see the `dependencies: ['setup']` wiring in
`playwright.config.ts`), and does two things, **in this order, on two
separate accounts**:

1. **Browser login** — logs in through the real UI via `loginPage`, then
   calls `page.context().storageState({ path: '.auth/app/appStorageState.json' })`.
   Every `chromium`-project test starts with this storage state already
   loaded (configured in `playwright.config.ts`), so it's already logged in
   — no test spends time on a login flow it isn't testing.
2. **API login** — calls `authenticateDemoqaUser()` (`helpers/auth.ts`) to
   get a bearer token + userId, and writes them to `.auth/app/apiSession.json`.
   The `apiSession` fixture reads this file lazily for any test that needs
   authenticated API calls.

**Why two accounts, and why that order:** demoqa keeps only one _active_
token per account — issuing a new one (via browser Login or via
GenerateToken) silently invalidates whatever token the other flow was
using. Doing both steps on the same account, in either order, leaves one of
the two sessions dead before any test runs. `DEMOQA_USERNAME`/`PASSWORD`
back the browser session; `DEMOQA_API_USERNAME`/`PASSWORD` back the API
session, so neither invalidates the other. If you ever see `"User not
authorized!"` on a page that should be logged in, or a 401 from
`apiRequest`, this is the first thing to check — it means something
re-authenticated on the wrong account.

## One-time account setup

`auth.setup.ts` expects `env/.env` to already have `DEMOQA_USERNAME` /
`DEMOQA_PASSWORD` (browser) and `DEMOQA_API_USERNAME` / `DEMOQA_API_PASSWORD`
(API). Run `npm run setup:user` once (see `scripts/setup-test-user.ts`) to
create both demoqa accounts and populate those variables — it's a no-op for
any pair that's already set.

## Opting out (login-flow tests)

A spec that specifically tests the login flow (e.g.
`tests/app/functional/login.spec.ts`) needs to start logged out. Call the
`resetStorageState` fixture at the top of the test:

```typescript
test('should reject login with an unknown username', { tag: '@sanity' }, async ({ loginPage, resetStorageState }) => {
    await test.step('GIVEN a logged-out session', async () => {
        await resetStorageState();
    });
    // ...
});
```

Don't hand-roll cookie clearing in a test — use the fixture, so the
mechanism stays in one place if the auth strategy changes.
