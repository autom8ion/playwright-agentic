---
name: maintenance
description: Proactively react to application changes — heal broken tests and extend coverage for new/changed functionality via the playwright-orchestrator and its leaf agents.
---

# Test Maintenance

The router for "the app changed, make sure tests still reflect it" — triggered explicitly,
noticed incidentally, or run periodically. It orchestrates the Playwright agents
(`.claude/agents/playwright-*.md`, backed by the `playwright-test` MCP server in `.mcp.json`);
it does not duplicate their logic.

## Start from a summary, not raw output

```bash
npm run test:summary -- <files or --grep @tag>     # or nothing for the non-destructive suite
```

One `PASS/FAIL/FLAKY` line plus one `FAIL <file> :: <title> :: <cause>` line per failure. That
output is what you hand to agents; never paste full Playwright output into a prompt.

## Decision: heal vs. plan+generate

- **Same scenario, stale mechanics** (selector, label text, incidental value) → `/heal <file>`
  with "failures are obviously stale mechanics" so triage is skipped.
- **Scenario no longer exists** → don't heal it into testing nothing. Confirm with the user,
  delete the test and any orphaned page-object locators.
- **New/changed functionality, nothing failing** → `/coverage <what changed>`.
- **Not obviously any of the above** → `/heal <file>` without the "obviously stale" note; the
  orchestrator runs the triager first and routes FLAKY → stabilizer, TEST DEFECT → healer,
  PRODUCT REGRESSION/ENV CONFIG FAILURE/CI INFRA FAILURE/AMBIGUOUS → report only (the
  orchestrator also screens for a broken shared auth session before triaging per test, and
  fixes that itself rather than routing individual tests to the healer/stabilizer). See
  `.claude/skills/failure-triage/SKILL.md`.

A single maintenance pass often needs both: `/heal` for what broke, `/coverage` for what's new.
**`/maintain [what changed]`** does the whole pass in one call via the `playwright-maintainer`
agent (`.claude/agents/playwright-maintainer.md`): both suite tiers, heal, coverage for what you
describe, and the audits below (delete candidates, orphaned page-object members, leftover
`fixme()`s, chronic CI flakes) — reported for a human, never acted on.

## Calling agents directly (when the orchestrator is overkill)

One known-stale file, one flaky test, one triage question — call the leaf agent yourself:

- `Agent({subagent_type: "playwright-test-triager", prompt: "Triage: <FAIL lines>"})`
- `Agent({subagent_type: "playwright-test-healer", prompt: "Heal <file>: <FAIL lines>"})`
- `Agent({subagent_type: "playwright-flaky-stabilizer", prompt: "Stabilize <file> — flaky in N of last 20 CI runs"})`
- Planner: task + seed (`tests/app/seed.spec.ts`) + plan path (`specs/<name>.plan.md`).
- Generator: **one call per suite** (`### N.` heading), sequential — the MCP browser is shared.

Every leaf agent has the `agent-conventions` and `app-notes` skills preloaded and ends with a
fixed ≤ 25-line report; you do not need to tell them to read `CLAUDE.md`.

## After the agents run

1. `npm run test:summary -- <touched files>`; plus `npm run test:destructive` if anything
   touching the shared book collection changed.
2. `npm run format && npm run typecheck && npm run lint && npm run check:skills-drift`. The
   hooks (`.claude/settings.json`) already blocked banned patterns at write time and fed
   eslint/tsc errors back to the agent; this is the final confirmation, not the first look.
3. Surface any `test.fixme()` an agent left, and anything the orchestrator reported under
   "Needs a human" — PRODUCT REGRESSION, ENV CONFIG FAILURE, and CI INFRA FAILURE are all
   report-only by design, not just PRODUCT REGRESSION.
4. Report what changed and why, then let the user commit (Golden rule).
