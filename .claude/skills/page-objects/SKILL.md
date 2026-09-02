---
name: page-objects
description: How to structure Page Object Model classes under pages/.
---

# Page Objects

Every page in `pages/*.ts` is a class that takes a `Page` (or `Locator` for a
component) in its constructor and exposes three things, in this order:

1. **Interactive element locators** — getters returning `Locator`, one per
   thing a user acts on (inputs, buttons, links).
2. **Feedback / validation message locators** — getters for success/error
   text, banners, toasts.
3. **Action methods** — `async` methods that perform a user-level action
   (`login(userName, password)`, not `fillUserName()` + `fillPassword()` +
   `clickLogin()` called separately from the test).

```typescript
export class LoginPage {
    constructor(private readonly page: Page) {}

    // --- Interactive element locators ---
    get userNameInput(): Locator {
        return this.page.getByPlaceholder('User Name');
    }

    // --- Feedback / validation message locators ---
    get invalidCredentialsMessage(): Locator {
        return this.page.getByText(Messages.auth.invalidCredentials);
    }

    // --- Action methods ---
    async login(userName: string, password: string): Promise<void> {
        await this.userNameInput.fill(userName);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}
```

## Rules

- Tests import page objects only through fixtures (`fixtures/pom/test-options`)
  — never `new LoginPage(page)` inside a test. See `.claude/skills/fixtures-di/SKILL.md`.
- A page object never calls `expect()`. Assertions live in the test; page
  objects only expose locators and perform actions.
- A page object never reads `process.env` — accept data as method arguments,
  or reach it via `config/env.ts` if it's page-intrinsic (rare).
- Prefer one method per user intent, not one method per DOM interaction. If a
  test needs to fill three fields and click submit, that's one method.
- Locator getters, not cached fields — Playwright locators are lazy and
  re-query on every action, so caching a `Locator` in a constructor-assigned
  field (instead of a getter) is the classic source of "stale element"
  flakiness. See `.claude/skills/locators-assertions/SKILL.md` for how to pick the locator itself.

## Before writing or editing a page object

Explore the real page first (browser tooling / MCP, or `playwright test --ui`
against it) and confirm the locator actually resolves uniquely. Don't invent
a `getByRole` name or `getByPlaceholder` string from memory — copy it from
what the page actually renders. If you can't reach the page, stop and say so
rather than guessing.
