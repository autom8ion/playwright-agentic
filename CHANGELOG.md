# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `playwright-test-reviewer` leaf agent (read-only): semantic Constitution review of what the
  writer agents or a human just changed — assertions that prove the scenario, tag fit, locator
  priority beyond regex reach, static-vs-factory data. The orchestrator runs it at the end of
  every coverage and heal pass and sends BLOCKERs back to the healer once (`Review-fix:` input).
- Orchestrator `gap-audit` mode / planner `Mode: gap-audit`: walks the app's left-nav and writes
  `specs/coverage-gaps.md` with a paste-ready `/coverage` line per uncovered or thin page.
- `docs/ARCHITECTURE.md`: Mermaid diagrams of the agents, hooks, and MCP server, plus the
  step-by-step flow for `/coverage`, `/heal`, and `/maintain`.
- Prompt templates `.claude/prompts/playwright-test-review.md` and `playwright-gap-audit.md`.

### Changed

- `playwright-test-planner`: "edge cases" in scenario design is now an explicit checklist
  (inputs, required/combos, interaction, state/data, session, API), each item probed live
  before it's planned, tagged `@regression`, with values named in `test-data/static/*.ts`.
- Orchestrator coverage mode now also runs any generated `@destructive` spec with `--workers 1`
  (the summary script excludes that tag by default, so those specs previously never ran).
- Planner captures a live **Response shape** per API suite and de-duplicates against already
  planned scenarios; generator writes the matching `z.strictObject()` schema, factory/static
  data, and `enums/messages.ts` entries before the spec; triager can call an endpoint directly
  for `@api` failures.
- Maintainer audits now include `pages/components/`, orphaned `Routes`/`Endpoints`/`Messages`
  keys, planned-but-never-generated scenarios, and specs whose `// spec:` plan no longer exists.

## [0.2.0] - 2026-09-07

### Added

- `/maintain` skill plus a `playwright-maintainer` subagent: a full proactive pass (both suite
  tiers, heal via the orchestrator, coverage for described changes, audits for dead scenarios /
  orphaned locators / leftover `fixme()`s / chronic CI flakes) that never deletes on its own.
- `/coverage` and `/heal` skills plus a `playwright-orchestrator` subagent that runs the
  plan → generate → run → heal (or summarize → triage → heal/stabilize) pipeline and returns
  one short report, so the main session never hand-drives leaf agents.
- `agent-conventions` and `app-notes` skills, preloaded into every Playwright subagent in
  place of "read CLAUDE.md and three skills first".
- `scripts/test-summary.js` (`npm run test:summary`): a ≤ 40-line digest of a Playwright run
  or a CTRF report, for agents and reports.
- `fixtures/pom/network-fixture.ts`: aborts ad/tag-manager/analytics requests for browser tests.
- PostToolUse hook (`post_write_check.py`) feeding eslint/tsc errors back on the turn a file is
  written, and a SubagentStop gate (`subagent_stop_gate.py`) that won't let a writer agent
  finish with a red typecheck. Project-level permission allowlist for the routine commands.
- `npm run check:hook`: 21-case self-test of the enforcement hook, also run in CI.

### Changed

- All five leaf agents: preloaded skills, `maxTurns`, no `Agent` tool, no screenshot tool on
  the planner, generator called once per plan suite instead of once per scenario, healer
  always scoped, fixed report format.
- `enforce_constitution.py` normalizes absolute paths (the spec-import rule previously never
  fired for native Write/Edit) and adds spec-only rules: no `page.locator`/`page.getBy*`, no
  `new XPage(page)`, imports only from `test-options`, one tag per `test()`, GIVEN/WHEN/THEN
  steps on full-file writes.

## [0.1.0] - 2026-09-02

### Added

- Initial scaffold: Constitution (`CLAUDE.md`), skills (`.claude/skills/`), and the
  `enforce_constitution.py` PreToolUse hook.
- Page Object Model layer for demoqa.com (Login, Book Store, Profile).
- Fixture-based dependency injection (`fixtures/pom/test-options.ts`).
- API testing layer with Zod schema validation against the demoqa Account/BookStore API.
- Faker-based data factories plus static boundary/invalid-value test data.
- `auth.setup.ts` storage-state pattern (API token + browser session).
- CI workflow, Husky pre-commit hooks, and version/skills-drift checks.
