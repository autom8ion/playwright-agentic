# AI Workflows

Step-by-step playbooks for the changes you'll make most often in this repo.
Read `CLAUDE.md` first — this file is the "how," that one is the "law."

## Add a new UI test for an existing page

1. Confirm a page object already exists for the page in `pages/`. If not,
   do "Add a new page object" first.
2. Pick exactly one tag (`.claude/skills/tagging/SKILL.md`) based on what the test
   actually verifies.
3. Add the spec under `tests/app/functional/` (single-page behavior) or
   `tests/app/e2e/` (multi-page journey).
4. Import only from `fixtures/pom/test-options`. Structure the body as
   GIVEN/WHEN/THEN `test.step()`s.
5. Run it: `npx playwright test <file> --headed` to watch it locally before
   committing.

## Add a new page object

1. Open the real page and inspect it: `npx playwright cli open <url>` then
   `npx playwright cli snapshot` — read locators off the accessibility tree,
   don't guess them. See `.claude/skills/playwright-cli/SKILL.md`.
2. Create `pages/<Name>Page.ts` following the three-section structure in
   `.claude/skills/page-objects/SKILL.md` (interactive locators → feedback
   locators → action methods).
3. Register it in `fixtures/pom/page-object-fixture.ts`.
4. Add any URL paths to `enums/endpoints.ts` and any static UI copy you need
   to assert on to `enums/messages.ts` — don't inline strings in the page
   object or the test.

## Add a new API test

1. Add the endpoint path to `enums/endpoints.ts` if it isn't there yet.
2. If the response shape is new, add a `z.strictObject()` schema in
   `test-data/schemas/`.
3. Add the spec under `tests/app/api/*.api.spec.ts`, tagged `@api`, using the
   `apiRequest` fixture. See `.claude/skills/api-testing/SKILL.md`.
4. If the test needs to mutate then clean up its own data, consider whether
   that setup/teardown belongs in a reusable `helper-fixture.ts` fixture
   (like `createdBook`) rather than inline in the test.

## Add a fixture

Decide which layer it belongs to first — see the chain diagram in
`.claude/skills/fixtures-di/SKILL.md`. Add it to that file's `base.extend()`
call; `test-options.ts` doesn't change unless you're adding a new re-export.

## Investigate a flaky or failing test

1. Run it in isolation with trace on: `npx playwright test <file> --trace on`.
2. Open the trace — `npx playwright show-trace` for the visual viewer, or the
   `playwright-trace` skill to inspect it from the command line (actions,
   requests, console, errors) without a browser. Don't add a
   `waitForTimeout` to paper over a race (it's blocked by the hook anyway) —
   find the actual condition the test should be waiting on.
3. If the trace points at a specific locator, confirm the fix live before
   editing the page object: `npx playwright cli open <url>` to reach the
   same state, then `npx playwright cli snapshot` (or `click`/`fill` to
   reproduce the exact steps) to check what the correct locator actually is
   now. Fix it in the page object so every test using it benefits.
4. One test, quick diagnosis → fix it yourself as above. Several tests
   failing, or you don't yet know the root cause → this is what the
   `playwright-test-healer` agent is for (see "React to an application
   change" below); it will drive the real browser to diagnose each failure
   rather than guessing from the stack trace alone.

## React to an application change (proactive maintenance)

The target app changed (a flow was reworked, a page redesigned, a feature
added) and tests need to catch up — whether something already failed or
not. Start with `.claude/skills/maintenance/SKILL.md`; short version:

1. Run the affected tests (or the full suite if you're not sure what's
   affected) and classify each failure: stale test mechanics (heal it) vs.
   scenario no longer exists (delete it, don't force it green) vs.
   ambiguous/possible regression (stop and ask — don't heal over a real bug).
2. Failures with a clear stale-selector/assertion cause → the
   `playwright-test-healer` agent (`.claude/agents/playwright-test-healer.md`).
3. New/changed functionality with no failing test to anchor on → the
   `playwright-test-planner` agent to scope scenarios into `specs/*.plan.md`,
   then `playwright-test-generator` per scenario.
4. Re-run the full suite (including `npm run test:destructive` if anything
   touching shared state was touched), typecheck/lint/format, and check for
   any `test.fixme()` the healer left — that means it found a likely
   **application** regression, not a stale test, and it needs a human look.

## Release a version bump

1. `npm run version:stamp <x.y.z>` — writes `VERSION` and `package.json`
   together.
2. Add a `## [x.y.z]` entry to `CHANGELOG.md`.
3. `npm run check:version` — confirms `VERSION`, `package.json`, and the
   changelog's latest entry agree. This also runs in CI and as a pre-commit
   hook.
