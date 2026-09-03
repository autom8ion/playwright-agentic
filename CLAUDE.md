# Constitution — Agentic Playwright

This file is always loaded by Claude Code. It's the quick-reference "law" for
this repo; the full reasoning and examples for each rule live in
`.claude/skills/*/SKILL.md`. A PreToolUse hook (`.claude/scripts/enforce_constitution.py`)
mechanically blocks the subset of these rules that are cheap to detect by
regex — treat that as a backstop, not the spec. Follow the rules even where
the hook can't see the violation.

## Golden rule: Verify → Commit → Proceed

One prompt → review the diff → run the relevant tests → commit working code →
next prompt. Don't stack multiple unverified changes.

## Non-negotiables

1. **Page Object Model.** All locators and page interactions live in
   `pages/*.ts`. Tests never call `page.locator(...)` directly — they call a
   page object method or read a page object locator. See `.claude/skills/page-objects/SKILL.md`.
2. **Locator priority.** `getByRole` → `getByLabel` → `getByPlaceholder` →
   `getByText` → `getByTestId` → CSS as a last resort. **Never XPath.**
   See `.claude/skills/locators-assertions/SKILL.md`.
3. **Web-first assertions only.** No `waitForTimeout`. Assert on the
   condition you actually care about (`toBeVisible`, `toHaveText`, ...).
   See `.claude/skills/locators-assertions/SKILL.md`.
4. **Fixtures, not constructors.** Tests never do `new SomePage(page)`.
   Everything comes through `fixtures/pom/test-options.ts`, the single import
   point. Never import `@playwright/test` directly in a spec.
   See `.claude/skills/fixtures-di/SKILL.md`.
5. **Given/When/Then steps.** Every test body is wrapped in `test.step()`
   calls that read as GIVEN / WHEN / THEN (/ AND).
6. **Exactly one tag per test.** One of `@smoke`, `@sanity`, `@regression`,
   `@e2e`, `@api`, `@destructive` — on the `test()` call, never on
   `test.describe()`. `@destructive` is reserved for tests that mutate
   shared state (not tests that create-and-clean-up only their own data) and
   always runs with `--workers 1`. See `.claude/skills/tagging/SKILL.md`.
7. **API responses are validated with `z.strictObject()`**, never
   `z.object()` — unknown fields must fail the contract. See `.claude/skills/api-testing/SKILL.md`.
8. **Test data is bifurcated.** Static boundary/invalid values live in
   `test-data/static/*.ts` with `as const` (never `.json`). Dynamic
   happy-path data comes from `test-data/factories/*.ts` via Faker.
   See `.claude/skills/data-strategy/SKILL.md`.
9. **Auth via storage state.** Tests don't log in themselves; `auth.setup.ts`
   authenticates once (API token + browser session) and every test reuses
   `.auth/app/appStorageState.json`. Tests that must start logged out call
   the `resetStorageState` fixture. See `.claude/skills/auth-storage-state/SKILL.md`.
10. **Explore before generating page objects.** Before writing or editing a
    page object or UI test, open the real page with `npx playwright cli open
<url>` and `npx playwright cli snapshot`, and confirm the locator you're
    about to write resolves uniquely against the real accessibility tree.
    Don't guess selectors. This is a different mechanism from the plan/
    generate/heal agents' MCP browser tools — reach for it when _you_ (not a
    subagent) need a quick one-off look. See `.claude/skills/playwright-cli/SKILL.md`.

## Directory map

```
.claude/            Claude Code constitution, skills, agents, enforcement hook
.claude/agents/      Playwright plan/generate/heal subagent definitions
.claude/prompts/     Canonical prompt templates for the agents above
config/              env.ts — typed access to env/.env
enums/               endpoints, messages, tags — no magic strings in tests
fixtures/pom/        test-options.ts is the only import point for specs
helpers/             auth.ts — API helpers shared by setup + scripts
pages/               Page Object Model classes
specs/               Test plans written by the planner agent
test-data/           factories/ (Faker), static/ (as const), schemas/ (Zod)
tests/app/           functional/, api/, e2e/, auth.setup.ts, seed.spec.ts
scripts/             one-off/CI scripts (setup-test-user, version checks)
.mcp.json            Registers the Playwright test MCP server (agents' tools)
```

## Plan → Generate → Heal agents

Three Playwright-provided subagents, backed by the `playwright-test` MCP
server (`.mcp.json`), handle exploring the app and writing/fixing tests via
real browser interaction rather than guessed selectors:

- **`playwright-test-planner`** (`.claude/agents/playwright-test-planner.md`) — explores the
  live app from `tests/app/seed.spec.ts` and writes a scenario plan to `specs/*.plan.md`.
- **`playwright-test-generator`** (`.claude/agents/playwright-test-generator.md`) — turns one
  plan scenario at a time into a real spec file, driving the browser live rather than guessing
  markup.
- **`playwright-test-healer`** (`.claude/agents/playwright-test-healer.md`) — runs the suite,
  and for each failure, inspects the live app to find and fix the root cause.

All three have this repo's conventions appended to their agent files (Constitution imports,
fixtures, tagging, POM) — they don't just write generic Playwright. The enforcement hook covers
the generator's file-writing tool the same as native Write/Edit (see
`.claude/scripts/enforce_constitution.py`). **`.claude/skills/maintenance/SKILL.md` is the router**
for when to reach for which agent — start there for "the app changed, make sure tests reflect it."

## Skills index

- `.claude/skills/page-objects/SKILL.md` — structure, locator sections, method conventions
- `.claude/skills/locators-assertions/SKILL.md` — locator priority, web-first assertions, no hard waits
- `.claude/skills/fixtures-di/SKILL.md` — the three-layer fixture chain and test-options.ts
- `.claude/skills/api-testing/SKILL.md` — apiRequest fixture, Zod strictObject schemas
- `.claude/skills/data-strategy/SKILL.md` — static vs. factory test data
- `.claude/skills/tagging/SKILL.md` — the six tags and what each means
- `.claude/skills/auth-storage-state/SKILL.md` — auth.setup.ts and resetStorageState
- `.claude/skills/ai-native-workflow/SKILL.md` — how to approach non-trivial changes (confidence, unknowns, when to stop and ask)
- `.claude/skills/maintenance/SKILL.md` — router for healing/extending tests after app changes; when to heal vs. plan+generate
- `.claude/skills/playwright-cli/SKILL.md` — drive a real browser from the command line to explore the app before writing selectors
- `.claude/skills/playwright-trace/SKILL.md` — inspect `.zip` trace files from a failed run without opening a browser

## Confidence rule

For any non-trivial change, state a confidence (1–10) and your unknowns
before writing code. If confidence < 5, stop and ask rather than guessing.
See `.claude/skills/ai-native-workflow/SKILL.md`.
