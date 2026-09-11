---
name: locators-assertions
description: Locator priority order and web-first assertion rules — no XPath, no hard waits.
---

# Locators & Assertions

## Locator priority

Try these in order; stop at the first one that uniquely and stably resolves:

1. `getByRole(role, { name })` — matches how the accessibility tree, and
   real users with assistive tech, identify the element.
2. `getByLabel(text)` — form inputs with an associated `<label>`.
3. `getByPlaceholder(text)` — form inputs without a label.
4. `getByText(text)` — static content, messages, headings.
5. `getByTestId(id)` — when the app exposes `data-testid` and nothing above
   is unique or stable enough.
6. CSS selector — last resort only, and only for elements truly invisible to
   every option above (e.g. an element with no accessible role, label, text,
   or test id). Leave a one-line comment saying why the fallback was needed.

**XPath is never allowed**, in page objects or tests. It's blocked by the
enforcement hook (`.claude/scripts/enforce_constitution.py`) as well as by
this rule — XPath locators are brittle against DOM structure changes and
harder to review than the alternatives above.

## Assertions

- Always web-first: `await expect(locator).toBeVisible()`, `.toHaveText(...)`,
  `.toHaveCount(...)`, etc. These auto-retry until the condition holds or the
  assertion timeout elapses — they're both faster and more reliable than a
  wait-then-assert.
- **Never `page.waitForTimeout(ms)`.** If you're tempted to add one, there's
  a specific condition you're actually waiting for — assert on that
  condition instead. This is blocked by the enforcement hook.
- Avoid `waitForLoadState('networkidle')` for the same reason: it waits for
  "network went quiet," not for the thing your test actually needs.
- Assertions belong in the test (inside a `test.step`), not inside a page
  object method.

## Aria snapshots

`toMatchAriaSnapshot()` is also a web-first assertion — it auto-retries the same as
`toHaveText`/`toBeVisible` — and is worth reaching for when a scenario is really checking a
whole region's structure at once (e.g. "these N items, in this order, with this state") rather
than one element's text. It replaces a run of narrower assertions with a single call; see
`accordion-aria-snapshot.spec.ts` (a container's full structure + ARIA boolean state) and
`webtables-aria-snapshot.spec.ts` (one dynamically-added row, values interpolated into the
template) for worked examples. Two behaviors that are easy to get wrong:

- **Unlisted nodes are unconstrained, not asserted absent** — a descendant you don't list (e.g.
  a paragraph under a heading) or a trailing sibling you don't list (e.g. a table row's last
  cell) is simply not checked, not required to be missing. This is useful for trimming a
  snapshot down to the part a scenario actually cares about, but it also means leaving something
  out **doesn't** verify it isn't there.
- **Boolean ARIA state must be written explicitly to be checked.** A button with no `[expanded]`
  annotation in the template matches whether the real button is expanded or not. To actually
  assert "collapsed," write `[expanded=false]` — omitting the attribute is not equivalent.
