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

## Add coverage for a feature or page (agentic)

```
/coverage demoqa Elements > Buttons page: click, double-click, right-click
```

One call to the `playwright-orchestrator` subagent: planner → generator (once per suite) →
`npm run test:summary` → scoped heal if needed → format/typecheck/lint. You get a ≤ 40-line
report; review `git diff`, run anything you want to double-check, commit.

## Full maintenance pass (periodic / after a release)

```
/maintain checkout flow was redesigned; coupon field removed
```

One call to `playwright-maintainer`: runs both suite tiers, heals via the orchestrator, adds
coverage for what you described, and reports delete candidates, orphaned page-object members,
leftover `fixme()`s, and chronic CI flakes. It never deletes — read those sections first and
decide.

## React to an application change (proactive maintenance)

The target app changed and tests need to catch up — whether something already failed or not.
Start with `.claude/skills/maintenance/SKILL.md`; short version:

1. `npm run test:summary -- <files or --grep @tag>` — one line per failure, not a wall of
   stack traces. Classify: stale mechanics vs. scenario gone (delete it) vs. unclear.
2. Stale mechanics → `/heal <file>` and say "obviously stale" so triage is skipped. Unclear →
   `/heal <file>`; the orchestrator triages first and only heals TEST DEFECT verdicts, sends
   FLAKY to the stabilizer, and reports PRODUCT REGRESSION / AMBIGUOUS untouched.
3. New/changed functionality with nothing failing → `/coverage <what changed>`.
4. Read the report's "Needs a human" section first — a `test.fixme()` or a PRODUCT REGRESSION
   verdict is the finding. Then `git diff`, `npm run test:destructive` if shared state was
   touched, commit.

## Release a version bump

1. `npm run version:stamp <x.y.z>` — writes `VERSION` and `package.json`
   together.
2. Add a `## [x.y.z]` entry to `CHANGELOG.md`.
3. `npm run check:version` — confirms `VERSION`, `package.json`, and the
   changelog's latest entry agree. This also runs in CI and as a pre-commit
   hook.
