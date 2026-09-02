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

1. Open the real page and inspect it (browser tooling / MCP) — don't guess
   locators. See `.claude/skills/ai-native-workflow/SKILL.md`.
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
2. Open the trace (`npx playwright show-trace`) before changing anything —
   don't add a `waitForTimeout` to paper over a race (it's blocked by the
   hook anyway). Find the actual condition the test should be waiting on.
3. If the fix is a locator or timing issue in a page object, fix it there so
   every test using that page object benefits.

## Release a version bump

1. `npm run version:stamp <x.y.z>` — writes `VERSION` and `package.json`
   together.
2. Add a `## [x.y.z]` entry to `CHANGELOG.md`.
3. `npm run check:version` — confirms `VERSION`, `package.json`, and the
   changelog's latest entry agree. This also runs in CI and as a pre-commit
   hook.
