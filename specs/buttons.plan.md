# Buttons

## Application Overview

demoqa.com's Elements > Buttons page (`/buttons`) is a standalone, unauthenticated page with three buttons, each wired to a different interaction type: double-click, right-click, and a plain single left-click. Each interaction reveals its own confirmation `<p>` message appended below the buttons (all three can be visible simultaneously once triggered — they are not mutually exclusive or reset between interactions). No existing page object covers this section (`pages/LoginPage.ts`, `pages/BookStorePage.ts`, `pages/ProfilePage.ts`, `pages/WebTablesPage.ts`, `pages/PracticeFormPage.ts`, `pages/AlertsPage.ts`, `pages/AccordionPage.ts` are all scoped to other sections' markup). The generator must add `pages/ButtonsPage.ts`, register a `buttonsPage` fixture in `fixtures/pom/page-object-fixture.ts` the same way the other six page objects are wired in, and add `Routes.buttons = '/buttons'` to `enums/endpoints.ts`. All three scenarios are single-page, one-behavior checks confined entirely to this page, so per `.claude/skills/tagging/SKILL.md` they are `@sanity` (not `@smoke`, which is reserved for this repo's existing Book Store critical path; not `@regression`, which is reserved for edge cases/broader interactions — these are the three happy-path interactions the page exists to test).

Investigation notes for the generator (live exploration on 2026-09-07): the third button's accessible name is literally "Click Me" while the other two are "Double Click Me" and "Right Click Me" — Playwright's default `getByRole` name matching is substring and case-insensitive, so a bare `getByRole('button', { name: 'Click Me' })` matches all three buttons, not just the third. The locator MUST use `{ name: 'Click Me', exact: true }` to resolve uniquely. Confirmed via DOM inspection that the third button's `id` attribute is a randomly-generated string (e.g. `id="9VBpt"`) that changes on every page load/reload — never hardcode or assert on it; the accessible name is the only stable identifier. Confirmed live: double-clicking "Double Click Me" appends a paragraph reading exactly "You have done a double click" (no trailing period); right-clicking "Right Click Me" appends "You have done a right click"; single left-clicking the dynamic "Click Me" button appends "You have done a dynamic click". All three messages are plain, unstyled `<p>` elements with no distinguishing role — `getByText(...)` resolves each uniquely since the three message strings don't overlap as substrings of one another. No dialog, no navigation, no state to reset between scenarios — each test's own click is independent of the others, so the three scenarios can run in any order without interfering.

## Locator inventory

### Buttons (`/buttons`)

- "Double Click Me" button → `getByRole('button', { name: 'Double Click Me' })`
- "Right Click Me" button → `getByRole('button', { name: 'Right Click Me' })`
- "Click Me" button (third button; DOM `id` is a random string regenerated on every page load, e.g. `id="9VBpt"` — never hardcode it, locate by name only) → `getByRole('button', { name: 'Click Me', exact: true })` (note: `exact: true` is required — the default substring/case-insensitive accessible-name match would also match "Double Click Me" and "Right Click Me")
- Double-click confirmation message → `getByText('You have done a double click')`
- Right-click confirmation message → `getByText('You have done a right click')`
- Dynamic click confirmation message → `getByText('You have done a dynamic click')`

## Test Scenarios

### 1. Buttons

**Seed:** `tests/app/seed.spec.ts`

#### 1.1. should show the double-click confirmation message when double-clicking the Double Click Me button (tag: @sanity)

**File:** `tests/app/functional/buttons-double-click.spec.ts`

**Steps:**

1. GIVEN a new ButtonsPage page object navigates to https://demoqa.com/buttons (no login/seed navigation needed) - expect: The 'Double Click Me', 'Right Click Me', and 'Click Me' buttons are all visible, and no confirmation messages are present yet
2. WHEN double-clicking the 'Double Click Me' button (getByRole('button', { name: 'Double Click Me' }).dblclick()) - expect: The double click resolves without error
3. THEN the double-click confirmation message appears - expect: The text 'You have done a double click' is visible on the page

#### 1.2. should show the right-click confirmation message when right-clicking the Right Click Me button (tag: @sanity)

**File:** `tests/app/functional/buttons-right-click.spec.ts`

**Steps:**

1. GIVEN a new ButtonsPage page object navigates to https://demoqa.com/buttons - expect: The 'Right Click Me' button is visible and no right-click confirmation message is present yet
2. WHEN right-clicking the 'Right Click Me' button (getByRole('button', { name: 'Right Click Me' }).click({ button: 'right' })) - expect: The right click resolves without error (no native context menu assertion needed)
3. THEN the right-click confirmation message appears - expect: The text 'You have done a right click' is visible on the page

#### 1.3. should show the dynamic click confirmation message when single-clicking the third, dynamically-id'd Click Me button (tag: @sanity)

**File:** `tests/app/functional/buttons-dynamic-click.spec.ts`

**Steps:**

1. GIVEN a new ButtonsPage page object navigates to https://demoqa.com/buttons - expect: The third button, named exactly 'Click Me' (DOM id is a random string regenerated per page load, e.g. '9VBpt' — do not assert on it), is visible and no dynamic-click confirmation message is present yet
2. WHEN single-clicking the 'Click Me' button using an exact-name locator (getByRole('button', { name: 'Click Me', exact: true }).click()) so it does not also match 'Double Click Me' or 'Right Click Me' - expect: The click resolves without error
3. THEN the dynamic-click confirmation message appears - expect: The text 'You have done a dynamic click' is visible on the page
