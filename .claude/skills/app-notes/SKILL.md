---
name: app-notes
description: Verified facts and quirks about the target app (demoqa.com) so agents don't re-discover them live — read before exploring, append when you learn something new.
---

# App Notes — demoqa.com

Facts confirmed by live exploration. Agents: read this before snapshotting a page; planners and
healers append new facts under the right heading (keep each to one line, dated).

## Global

- Google ads / tag manager / analytics requests load on every page. `fixtures/pom/network-fixture.ts`
  aborts them for tests and for the agents' seed-based setup pages, so ignore any ad frames
  that still appear in a snapshot and any aborted ad requests in network logs.
- Only the Book Store section needs login; every other section is reachable by URL unauthenticated.
- Pages are heavy; first navigation can take several seconds. Use web-first assertions, not waits.

## Book Store (`/books`, `/profile`, `/login`)

- Adding a book fires a native `alert()` after the POST resolves; race `waitForEvent('dialog')`
  against the click (`BookStorePage.addCurrentBookToCollection`).
- The whole suite shares one demoqa user (`.auth/app/apiSession.json`). Anything mutating that
  user's collection needs `lock: 'bookstore-collection'`.
- Profile delete control is a bare element with no role; `ProfilePage.deleteButton` is a CSS id.

## Web Tables (`/webtables`)

- Add modal fields: textboxes "First Name", "Last Name", "name@example.com", "Age", "Salary",
  "Department"; button "Submit". Modal is the only `role=dialog` (no accessible name).
- Rows: `getByRole('row').filter({ hasText })`. Edit/Delete are `<span title="Edit|Delete">`
  with no role → `row.getByTitle('Edit')`.
- Search box `getByPlaceholder('Type to search')` filters client-side as you type.
- Seeded rows: Cierra Vega, Alden Cantrell, Kierra Gentry (ids 1–3; ids not shown in UI).

## Practice Form (`/automation-practice-form`)

- Required: First Name, Last Name, Gender radio, Mobile Number. Invalid fields get border
  `rgb(220, 53, 69)`. Mobile "(10 Digits)" label is NOT enforced — don't assert length validation.
- Subjects is a react-select (`#subjectsInput`): type then Enter; accepts any text.
- State → City are chained react-selects; city options depend on state (Haryana → Karnal/Panipat).
  Factory must emit a valid pair.
- "Choose File" is a native file input; use `setInputFiles({ name, mimeType, buffer })`.
- Submit opens `dialog` "Thanks for submitting the form" with a Label/Values table echoing inputs.

## Alerts (`/alerts`)

- Four buttons all named "Click me"; no distinguishing container role → CSS ids are the last
  resort: `#alertButton`, `#timerAlertButton`, `#confirmButton`, `#promtButton` (sic).
- Messages: plain "You clicked a button"; timer (≈5 s) "This alert appeared after 5 seconds";
  confirm "Do you confirm action?" → `#confirmResult` "You selected Ok|Cancel"; prompt "Please
  enter your name" → `#promptResult` "You entered <text>". Result elements don't exist until first use.

## Accordion (`/accordian` — URL typo is real)

- Three `heading > button` sections; single-open behavior (expanding one collapses the other).
- Assert state via `aria-expanded` on the button plus visibility of the section's paragraph.

## Buttons (`/buttons`)

- Three buttons: "Double Click Me", "Right Click Me", "Click Me". The third has a random DOM id
  regenerated on every load — locate by name, and use `exact: true` (default substring match on
  "Click Me" also hits the other two).
- Messages are plain `<p>`s, independent and non-exclusive: "You have done a double click" /
  "You have done a right click" / "You have done a dynamic click". No login required.
