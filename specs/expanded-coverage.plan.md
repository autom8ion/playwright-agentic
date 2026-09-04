# Expanded Coverage — Web Tables, Practice Form, Alerts, Accordion

## Application Overview

demoqa.com hosts several independent framework-feature "playgrounds" alongside the Book
Store application this repo already covers. This plan adds coverage for four of them —
Elements > Web Tables, Forms > Practice Form, Alerts/Frame & Windows > Alerts, and
Widgets > Accordion — none of which require login and all of which are reachable directly by
URL on the same demoqa.com origin as the existing Book Store tests.

None of the existing page objects (`pages/LoginPage.ts`, `pages/BookStorePage.ts`,
`pages/ProfilePage.ts`) are reusable here: they are scoped entirely to the Book Store app's
markup (search box, book rows, collection table) and share no locators with these four
sections. Four new page objects are needed — `pages/WebTablesPage.ts`,
`pages/PracticeFormPage.ts`, `pages/AlertsPage.ts`, `pages/AccordionPage.ts` — wired into
`fixtures/pom/test-options.ts` the same way the existing three are. `enums/endpoints.ts`
`Routes` needs four new entries; note demoqa's own URL is spelled `/accordian` (sic), not
`/accordion` — copy the real value, don't autocorrect it.

All scenarios below are single-page UI behavior confined to one demoqa.com section, so per
`.claude/skills/tagging/SKILL.md` none of them warrant `@e2e` (reserved for flows crossing
multiple pages/apps) or `@smoke` (reserved for this repo's existing critical-path check, the
seed-equivalent `bookstore.spec.ts` search test). Straightforward one-behavior checks are
tagged `@sanity`; checks that cover a validation edge case, a delayed/async trigger, or a
broader interaction (filter-then-verify, expand-then-verify-collapse) are tagged `@regression`.
Every test still needs its exactly-one tag (see rule 6 of the constitution) — it's called out
per test below, but the generator should apply it via the `test()` options object, not infer it.

Investigation notes for the generator (from live exploration on 2026-09-04), to save it
re-discovering the same things:

- **Web Tables** (`/webtables`): the "Add" button opens a modal with `textbox` fields
  "First Name", "Last Name", "name@example.com" (email), "Age", "Salary", "Department", and a
  "Submit" button — all reachable via `getByRole('textbox', { name: ... })`. Table rows are
  `getByRole('row')`, filterable by cell text the same way `ProfilePage.bookRow` filters by
  title. The per-row Edit/Delete controls are `<span title="Edit" id="edit-record-N">` /
  `<span title="Delete" id="delete-record-N">` — bare `<span>`s with no interactive ARIA role,
  so `getByRole('button', ...)` will NOT find them. The seeded rows use ids 1/2/3 and new rows
  get the next sequential id, but that id is never displayed in the UI, so don't hardcode it —
  scope to the row found via `getByRole('row').filter({ hasText: <unique value> })` first, then
  locate the Edit/Delete control within that row scope (e.g. `.getByTitle('Edit')` — Playwright's
  dedicated title-based locator — is a better fit here than a guessed CSS id, since the ARIA
  `title` attribute is the only accessible identifier these controls expose). The search box is
  `getByPlaceholder('Type to search')` and filters rows client-side as you type (confirmed:
  searching "Cierra" left exactly one row visible).
- **Practice Form** (`/automation-practice-form`): fields are `textbox` "First Name",
  "Last Name", "name@example.com", `radio` "Male"/"Female"/"Other", `textbox` "Mobile Number",
  a date-of-birth textbox pre-filled with today's date, a "Subjects" react-select
  (`#subjectsInput`, type text then press Enter to add — it does NOT strictly validate against
  a known subject list; typing "Maths" and pressing Enter adds it as a chip), `checkbox`
  "Sports"/"Reading"/"Music" hobbies, a "Choose File" control (a native
  `<input type="file">` — Playwright exposes it with `role=button, name="Choose File"` and
  `setInputFiles()` works directly on that locator; no on-disk fixture asset exists in this repo
  yet, so prefer `setInputFiles({ name, mimeType, buffer })` with an in-memory buffer over
  checking in a binary file), `textbox` "Current Address", and two chained react-select
  dropdowns "Select State" → "Select City" (the city options depend on which state was picked —
  confirmed Haryana → Karnal/Panipat — so the factory must generate a valid (state, city) pair,
  not independent random values). Submitting opens a `dialog` titled "Thanks for submitting the
  form" containing a two-column `table` (Label/Values) with rows for Student Name, Student
  Email, Gender, Mobile, Date of Birth, Subjects, Hobbies, Picture, Address, and State and City —
  confirmed each row echoes back exactly what was entered (e.g. "Haryana Karnal" for the last
  row). Submitting with all fields empty leaves the modal closed and gives the required fields
  (confirmed: First Name) a red border (`getByRole('textbox', ...)` plus a
  `toHaveCSS('border-color', 'rgb(220, 53, 69)')`-style assertion, or simpler: assert the modal
  dialog stays hidden). Note: the "(10 Digits)" label on Mobile Number is not actually enforced —
  a 5-digit value was accepted and echoed verbatim in the confirmation modal, so do not write a
  scenario asserting length validation on that field, it would be asserting behavior the app
  doesn't have.
- **Alerts** (`/alerts`): four buttons, all with visible text "Click me" but distinct DOM ids
  (`alertButton`, `timerAlertButton`, `confirmButton`, `promtButton` — note the id typo,
  irrelevant if locating by role+surrounding text instead of id), each inside its own labelled
  container ("Click Button to see alert", "On button click, alert will appear after 5 seconds",
  "...confirm box will appear", "...prompt box will appear") — scope each button locator to its
  container the same way Web Tables scopes row actions, to disambiguate the four identical
  "Click me" names. Confirmed dialog text/behavior: plain alert → message "You clicked a
  button"; the timer alert fires the same alert after a ~5s delay (needs a longer-than-default
  wait for the `dialog` event, not a fixed sleep — `page.waitForEvent('dialog', { timeout: ... })`
  raced against the click, per the existing `BookStorePage.addCurrentBookToCollection` pattern);
  timer alert (correction, verified during generation) → message "This alert appeared after 5
  seconds", not the same text as the plain alert; confirm → message "Do you confirm action?", and
  after handling, an on-page result element
  reads "You selected Ok" (accept) or "You selected Cancel" (dismiss); prompt → message "Please
  enter your name", and after accepting with typed text, the result element reads
  "You entered &lt;text&gt;".
- **Accordion** (`/accordian` — sic): three sections, "What is Lorem Ipsum?" (expanded by
  default, with a `paragraph` of body text visible under it), "Where does it come from?", and
  "Why do we use it?", each a `heading > button`. Confirmed this is a single-open accordion:
  clicking section 2's header expands it (reveals two paragraphs) and simultaneously collapses
  section 1 (its `[expanded]` state and paragraph both go away) — i.e. sections are mutually
  exclusive, not independently toggleable. Section identity/expanded-state is best asserted via
  the button's `aria-expanded` (exposed as the snapshot's `[expanded]` marker) plus visibility of
  that section's paragraph text.

## Test Scenarios

### 1. Web Tables

**Seed:** `tests/app/seed.spec.ts`

#### 1.1. should add a new record via the Add modal and see it in the table (tag: @sanity)

**File:** `tests/app/functional/webtables-add-record.spec.ts`

**Steps:**

1. GIVEN a new WebTablesPage page object is used to navigate directly to https://demoqa.com/webtables (no login/seed navigation needed) - expect: The page has loaded with the 3 seeded rows (Cierra, Alden, Kierra) visible and an 'Add' button visible
2. WHEN clicking 'Add', filling First Name/Last Name/Email/Age/Salary/Department in the modal with generated data, and clicking 'Submit' - expect: The modal closes
3. THEN a new row containing the entered first name is visible in the table with all the entered values in the correct columns - expect: The row for the new record is visible via getByRole('row').filter({ hasText: <firstName> }) and contains the entered last name, age, email, salary, and department

#### 1.2. should edit an existing record and see the updated values in place (tag: @sanity)

**File:** `tests/app/functional/webtables-edit-record.spec.ts`

**Steps:**

1. GIVEN the Web Tables page with its 3 seeded rows - expect: The seeded row for 'Alden Cantrell' is visible
2. WHEN clicking the Edit control scoped to that row, changing the Age and Salary fields in the modal, and clicking Submit - expect: The modal closes
3. THEN the same row (still identifiable by its unchanged first/last name) shows the updated Age and Salary values - expect: The row's Age and Salary cells reflect the new values, not the original seeded ones

#### 1.3. should delete a record and remove it from the table (tag: @sanity)

**File:** `tests/app/functional/webtables-delete-record.spec.ts`

**Steps:**

1. GIVEN the Web Tables page, then add a new record via the Add modal so the test owns the row it deletes (avoids mutating the shared seeded rows) - expect: The newly added row is visible
2. WHEN clicking the Delete control scoped to that row - expect: No confirmation dialog is required by this app — the row is removed immediately
3. THEN the row is no longer present in the table - expect: getByRole('row').filter({ hasText: <firstName> }) is hidden/not present

#### 1.4. should filter rows to only matches when searching, and restore all rows when the search is cleared (tag: @regression)

**File:** `tests/app/functional/webtables-search-filter.spec.ts`

**Steps:**

1. GIVEN the Web Tables page with its 3 seeded rows all visible - expect: 3 rows are visible in the table body
2. WHEN typing a value that matches only one seeded row (e.g. 'Cierra') into the search box - expect: Only the matching row ('Cierra Vega') remains visible, the other two are hidden
3. AND clearing the search box - expect: All 3 seeded rows are visible again

### 2. Practice Form

**Seed:** `tests/app/seed.spec.ts`

#### 2.1. should submit the practice form with generated data and see every field echoed in the confirmation modal (tag: @sanity)

**File:** `tests/app/functional/practice-form-submit.spec.ts`

**Steps:**

1. GIVEN a new PracticeFormPage page object navigates to https://demoqa.com/automation-practice-form, and a new test-data/factories/practice-form-factory.ts generates a full set of field values (first/last name, email, gender, 10-digit mobile number, one hobby, one subject, a free-text address, and one valid (state, city) pair) via Faker — not hardcoded literals - expect: The form has loaded with all fields empty (default DOB textbox aside)
2. WHEN filling the text fields, selecting the generated gender radio and hobby checkbox, typing+entering the generated subject, uploading an in-memory file buffer as the picture, filling the address, and selecting the generated state then city, then clicking Submit - expect: The 'Thanks for submitting the form' confirmation dialog becomes visible
3. THEN each row of the confirmation table is asserted against the generated data - expect: Student Name row shows '<firstName> <lastName>' - expect: Student Email row shows the generated email - expect: Gender row shows the generated gender - expect: Mobile row shows the generated mobile number - expect: Subjects row shows the generated subject - expect: Hobbies row shows the generated hobby - expect: Address row shows the generated address - expect: State and City row shows '<state> <city>'

#### 2.2. should submit successfully with only the mandatory fields populated (tag: @regression)

**File:** `tests/app/functional/practice-form-minimal-required-fields.spec.ts`

**Steps:**

1. GIVEN the practice form page, with only First Name, Last Name, Gender, and Mobile Number filled from generated data (email, DOB override, subjects, hobbies, picture, address, state/city all left at their defaults/empty) - expect: No field shows a red-border invalid state before submitting
2. WHEN clicking Submit - expect: The confirmation dialog opens (i.e. those four fields are sufficient to pass validation)
3. THEN the confirmation modal's Student Name, Gender, and Mobile rows match the entered values, and the Student Email/Subjects/Hobbies/Address/State and City rows are empty - expect: Modal content matches what was and wasn't filled in

#### 2.3. should not open the confirmation modal and should flag required fields when submitting an empty form (tag: @regression)

**File:** `tests/app/functional/practice-form-empty-submit-validation.spec.ts`

**Steps:**

1. GIVEN a fresh, completely empty practice form - expect: No field has an invalid/red-border state yet
2. WHEN clicking Submit without filling anything - expect: The 'Thanks for submitting the form' dialog does NOT appear
3. THEN the required fields (First Name, Last Name, Gender, Mobile Number) are visibly flagged invalid - expect: The First Name (and Last Name, Mobile Number) textboxes have the invalid red border style, confirmed live as rgb(220, 53, 69); do not assert a length constraint on Mobile Number, it is not enforced by the app

### 3. Alerts

**Seed:** `tests/app/seed.spec.ts`

#### 3.1. should show a plain alert with the expected message and accept it (tag: @sanity)

**File:** `tests/app/functional/alerts-simple-alert.spec.ts`

**Steps:**

1. GIVEN a new AlertsPage page object navigates to https://demoqa.com/alerts - expect: The 'Click Button to see alert' section and its button are visible
2. WHEN clicking that button and racing the click against page.waitForEvent('dialog') the same way BookStorePage.addCurrentBookToCollection does - expect: A native alert dialog appears with message 'You clicked a button'
3. THEN the dialog is accepted - expect: The dialog closes and the page returns to a stable, interactable state (no residual dialog)

#### 3.2. should show an alert with the delayed message after a ~5 second delay when clicking the timer alert button (tag: @regression)

**File:** `tests/app/functional/alerts-timed-alert.spec.ts`

**Steps:**

1. GIVEN the Alerts page, on the 'On button click, alert will appear after 5 seconds' section - expect: Its button is visible
2. WHEN clicking that button and awaiting page.waitForEvent('dialog') with a timeout comfortably longer than 5s (no fixed sleep/hard wait) - expect: A dialog with message 'You clicked a button' eventually appears (after the delay, not immediately)
3. THEN the dialog is accepted - expect: The dialog closes cleanly

#### 3.3. should record the correct result text for both accepting and dismissing the confirm dialog (tag: @sanity)

**File:** `tests/app/functional/alerts-confirm-dialog.spec.ts`

**Steps:**

1. GIVEN the Alerts page, on the 'confirm box will appear' section - expect: Its button is visible and no result text is shown yet
2. WHEN clicking the button and accepting the resulting confirm dialog (message 'Do you confirm action?') - expect: An on-page result element reads 'You selected Ok'
3. AND clicking the button again and dismissing (Cancel) the confirm dialog this time - expect: The result element updates to read 'You selected Cancel'

#### 3.4. should echo back the typed text after accepting the prompt dialog (tag: @sanity)

**File:** `tests/app/functional/alerts-prompt-dialog.spec.ts`

**Steps:**

1. GIVEN the Alerts page, on the 'prompt box will appear' section - expect: Its button is visible
2. WHEN clicking the button and accepting the resulting prompt dialog (message 'Please enter your name') with a generated/known name value - expect: The dialog closes
3. THEN an on-page result element reads 'You entered <the typed name>' - expect: Result text matches exactly what was typed into the prompt

### 4. Accordion

**Seed:** `tests/app/seed.spec.ts`

#### 4.1. should show only the default-expanded section's content on page load (tag: @sanity)

**File:** `tests/app/functional/accordion-default-expanded.spec.ts`

**Steps:**

1. GIVEN a new AccordionPage page object navigates to https://demoqa.com/accordian - expect: The 'What is Lorem Ipsum?' section header is visible and reports an expanded state (aria-expanded true)
2. THEN only that section's paragraph content is visible - expect: The 'What is Lorem Ipsum?' body paragraph is visible; the 'Where does it come from?' and 'Why do we use it?' sections show no body text and report aria-expanded false

#### 4.2. should collapse the previously-open section when a different section is expanded (tag: @regression)

**File:** `tests/app/functional/accordion-single-open-behavior.spec.ts`

**Steps:**

1. GIVEN the Accordion page with 'What is Lorem Ipsum?' expanded by default - expect: Its paragraph content is visible
2. WHEN clicking the 'Where does it come from?' section header - expect: That section expands and its two paragraphs become visible
3. THEN the previously-open 'What is Lorem Ipsum?' section is collapsed - expect: Its aria-expanded state is false and its paragraph content is no longer visible, confirming only one section is open at a time
