---
name: agent-conventions
description: Compact rule card preloaded into every Playwright subagent — everything needed to write a Constitution-compliant spec or page object without reading CLAUDE.md or the other skills.
---

# Agent Conventions Card

This is the whole rulebook for a subagent writing tests in this repo. Do not read `CLAUDE.md`
(it is already in your context) or the other skills unless something here is genuinely ambiguous.

## Spec file shape (copy this)

```typescript
// spec: specs/<plan>.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Web Tables', () => {
    test('should add a new record via the Add modal', { tag: '@sanity' }, async ({ webTablesPage }) => {
        await test.step('GIVEN the Web Tables page', async () => {
            await webTablesPage.goto();
            await expect(webTablesPage.addButton).toBeVisible();
        });

        await test.step('WHEN adding a record', async () => {
            await webTablesPage.addRecord(record);
        });

        await test.step('THEN the new row is visible', async () => {
            await expect(webTablesPage.row(record.firstName)).toBeVisible();
        });
    });
});
```

## Hard rules (the hook blocks the starred ones)

- \* Only test-framework import: `fixtures/pom/test-options` (relative path). Never `@playwright/test`.
- \* Specs never call `page.locator(...)`, `page.getBy*(...)`, or `new SomePage(page)`. Every
  locator lives on a page object in `pages/*.ts`; the test reaches it through a fixture.
- \* Exactly one tag per `test()`, in the options object: `@smoke` (critical path) · `@sanity`
  (one behavior) · `@regression` (edge case / broader) · `@e2e` (crosses pages) · `@api` (no
  browser) · `@destructive` (mutates shared state; runs `--workers 1`). Never on `test.describe()`.
- \* Body wrapped in `test.step('GIVEN …' | 'WHEN …' | 'THEN …' | 'AND …')`.
- \* No `waitForTimeout`, no `networkidle`, no XPath. Assert the condition you actually need
  (`toBeVisible`, `toHaveText`, `toBeHidden`, `toHaveCount`).
- Locator priority: `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText` → `getByTestId`
  → CSS (last resort, one-line comment saying why).
- Tests that mutate the shared demoqa user's book collection add `lock: 'bookstore-collection'`.
- \* API schemas use `z.strictObject()`; static data is `.ts` with `as const`, never `.json`.
- Static/boundary values → `test-data/static/*.ts`; unique happy-path data → Faker factories in
  `test-data/factories/*.ts`.

## Fixtures available (destructure from the test callback)

`loginPage` `bookStorePage` `profilePage` `webTablesPage` `practiceFormPage` `alertsPage`
`accordionPage` · `apiRequest({ method, url, data?, token? })` · `apiSession` (`userId`, `token`)
· `createdBook` (adds + removes one catalog book) · `resetStorageState()` (start logged out).

## Page object shape

```typescript
import type { Locator, Page } from '@playwright/test';
import { Routes } from '../enums/endpoints';

export class ButtonsPage {
    constructor(private readonly page: Page) {}

    // --- Interactive element locators ---   (getters, never cached fields)
    get doubleClickButton(): Locator {
        return this.page.getByRole('button', { name: 'Double Click Me' });
    }

    // --- Feedback / validation message locators ---
    get doubleClickMessage(): Locator {
        return this.page.getByText('You have done a double click');
    }

    // --- Action methods ---   (one per user intent; never call expect() here)
    async goto(): Promise<void> {
        await this.page.goto(Routes.buttons);
    }
}
```

New page object → also register it in `fixtures/pom/page-object-fixture.ts` (type + `extend`
entry) and add its path to `Routes` in `enums/endpoints.ts`. Native dialogs: race
`page.waitForEvent('dialog').then(d => d.accept())` against the click inside `Promise.all`
(see `pages/AlertsPage.ts`).

## Where files go

- `tests/app/functional/<feature>-<behavior>.spec.ts` — single-page behavior
- `tests/app/e2e/*.spec.ts` — multi-page journey · `tests/app/api/*.api.spec.ts` — API only
- `pages/<Name>Page.ts` · `test-data/factories|static|schemas/`

## Before you write a locator

Grep `pages/*.ts` for an existing getter first. If the plan carries a Locator inventory for the
page, use it instead of re-snapshotting. Only snapshot live when neither has what you need.

## Report format (end every run with exactly this, ≤ 25 lines, no code, no test output)

```
## Result: <DONE | PARTIAL | BLOCKED>
### Files written / changed
- <path> — <one clause>
### Failures remaining
- <file> :: <test title> :: <one-line cause>   (or "none")
### fixme left
- <file> :: <why>   (or "none")
### Notes for app-notes
- <new fact about the app worth persisting>   (or "none")
```
