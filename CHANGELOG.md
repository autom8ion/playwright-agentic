# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
