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

## Commands

See `README.md` for setup and the full command list; `npm run check:version` /
`check:skills-drift` / `check:hook` keep VERSION/CHANGELOG, the skills index, and the
enforcement hook honest. `npm run test:summary -- <args>` runs tests and prints a ≤ 40-line
digest — use it (not raw `npm test` output) whenever the result feeds an agent or a report.

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
   `test.describe()`. Hook-enforced on full-file writes, along with rule 5.
   `@destructive` is reserved for tests that mutate shared state (not tests
   that create-and-clean-up only their own data) and always runs with
   `--workers 1`. See `.claude/skills/tagging/SKILL.md`.
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

## Plan → Generate → Heal → Triage → Stabilize agents

**Entry points: `/coverage <what to cover>`, `/heal [file|@tag]`, and `/maintain [what changed]`**
(skills). The first two make one `Agent` call to **`playwright-orchestrator`**
(`.claude/agents/playwright-orchestrator.md`, sonnet), which runs the pipeline below and returns
a ≤ 40-line report; `/maintain` calls **`playwright-maintainer`**
(`.claude/agents/playwright-maintainer.md`), which wraps the orchestrator in a full pass (both
suite tiers, heal, optional coverage, audits for dead scenarios / orphaned locators / `fixme`s /
chronic CI flakes) and never deletes anything itself. The main session never hand-drives leaf
agents or reads raw test output. Five leaf subagents, backed by the
`playwright-test` MCP server (`.mcp.json`), explore the app and write/fix tests via real
browser interaction rather than guessed selectors:

- **`playwright-test-planner`** (`.claude/agents/playwright-test-planner.md`) — explores the
  live app from `tests/app/seed.spec.ts` and writes a scenario plan to `specs/*.plan.md`.
- **`playwright-test-generator`** (`.claude/agents/playwright-test-generator.md`) — turns one
  plan suite (every scenario under a `### N.` heading) into real spec files, driving the browser
  live rather than guessing markup.
- **`playwright-test-healer`** (`.claude/agents/playwright-test-healer.md`) — given a scoped
  failure list, inspects the live app to find and fix each root cause at the page-object level.
- **`playwright-test-triager`** (`.claude/agents/playwright-test-triager.md`) — analysis only,
  no edits: classifies a failing test as flaky, a stale-test defect, or a real product
  regression, with evidence, before anything else touches it.
- **`playwright-flaky-stabilizer`** (`.claude/agents/playwright-flaky-stabilizer.md`) — fixes a
  test's flakiness root cause (races, isolation, ordering) and verifies with repeated runs, not
  one pass.

All leaf agents preload `.claude/skills/agent-conventions/SKILL.md` (the compact rule card)
and `.claude/skills/app-notes/SKILL.md` (verified facts about the target app), are capped with
`maxTurns`, cannot spawn agents, and end with a fixed short report — never tell them to "read
CLAUDE.md first"; it is already in their context. The generator is called **once per plan
suite**, not per scenario. Three hooks in `.claude/settings.json` back this up: PreToolUse
(`enforce_constitution.py`, also covers the generator's MCP write tool), PostToolUse
(`post_write_check.py` feeds eslint/tsc errors back on the turn a file is written), and
SubagentStop (`subagent_stop_gate.py` won't let a writer agent finish with a red typecheck).
**`.claude/skills/maintenance/SKILL.md` is the router** for when to reach for which;
`.claude/skills/failure-triage/SKILL.md` and `.claude/skills/flaky-tests/SKILL.md` cover the
triager/stabilizer specifically.

## Skills index

- `.claude/skills/page-objects/SKILL.md` — structure, locator sections, method conventions
- `.claude/skills/locators-assertions/SKILL.md` — locator priority, web-first assertions, no hard waits
- `.claude/skills/fixtures-di/SKILL.md` — the four-layer fixture chain and test-options.ts
- `.claude/skills/api-testing/SKILL.md` — apiRequest fixture, Zod strictObject schemas
- `.claude/skills/data-strategy/SKILL.md` — static vs. factory test data
- `.claude/skills/tagging/SKILL.md` — the six tags and what each means
- `.claude/skills/auth-storage-state/SKILL.md` — auth.setup.ts and resetStorageState
- `.claude/skills/ai-native-workflow/SKILL.md` — how to approach non-trivial changes (confidence, unknowns, when to stop and ask)
- `.claude/skills/maintenance/SKILL.md` — router for healing/extending tests after app changes; when to heal vs. plan+generate
- `.claude/skills/failure-triage/SKILL.md` — classify a failing test as flaky, a test defect, or a product regression, with evidence
- `.claude/skills/flaky-tests/SKILL.md` — find chronically-flaky tests via CI history and local reruns, fix the root cause
- `.claude/skills/playwright-cli/SKILL.md` — drive a real browser from the command line to explore the app before writing selectors
- `.claude/skills/playwright-trace/SKILL.md` — inspect `.zip` trace files from a failed run without opening a browser
- `.claude/skills/pull-requests/SKILL.md` — pre-PR checklist mirroring CI, version-bump and commit/PR conventions
- `.claude/skills/agent-conventions/SKILL.md` — compact rule card preloaded into every Playwright subagent (spec/page-object shape, tags, report format)
- `.claude/skills/app-notes/SKILL.md` — verified facts and quirks about the target app so agents don't re-discover them live
- `.claude/skills/coverage/SKILL.md` — `/coverage <what>`: one orchestrator call for plan → generate → run → heal
- `.claude/skills/heal/SKILL.md` — `/heal [file|@tag]`: one orchestrator call for summarize → triage → heal/stabilize
- `.claude/skills/maintain/SKILL.md` — `/maintain [what changed]`: one maintainer call for a full status → heal → coverage → audit pass

## Confidence rule

For any non-trivial change, state a confidence (1–10) and your unknowns
before writing code. If confidence < 5, stop and ask rather than guessing.
See `.claude/skills/ai-native-workflow/SKILL.md`.
