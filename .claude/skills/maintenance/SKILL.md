---
name: maintenance
description: Proactively react to application changes — heal broken tests and extend coverage for new/changed functionality using the Playwright plan/generate/heal agents.
---

# Test Maintenance

This is the router for "the app changed, make sure tests still reflect it" — whether that's
triggered explicitly ("heal the tests", "the checkout flow changed, update coverage"), noticed
incidentally (a test fails during unrelated work), or run periodically. It orchestrates the three
Playwright agents (`.claude/agents/playwright-test-*.md`, backed by the `playwright-test` MCP
server declared in `.mcp.json`) rather than duplicating their logic — this skill is about **when**
and **which** agent to reach for, not how each one works internally.

## Decision: heal vs. plan+generate

Run the affected tests first (`npx playwright test <path> --grep-invert @destructive`, or the full
`npm test` if you don't know what's affected) and classify each failure before doing anything:

- **Same scenario, different implementation detail** (a selector no longer resolves, a label's text
  changed, timing shifted) → the scenario is still valid, only the test's mechanics are stale. Use
  `playwright-test-healer`.
- **The scenario itself no longer exists** (a flow was removed or replaced) → don't heal it into
  something that doesn't test anything real. Confirm with the user, then delete the test (and any
  page-object locators that now have no callers) rather than forcing it to pass.
- **New or materially changed functionality with no failing test** (nothing failed, but a page or
  flow changed enough that current coverage doesn't reflect it) → there's nothing to heal. Use
  `playwright-test-planner` to scope what's new, then `playwright-test-generator` per scenario. This
  is the "proactive" half — don't wait for a failure if you already know the app changed.
- **Ambiguous** (a failure could be a real regression, not a stale test) → stop and ask. Healing a
  test into passing against a genuine bug hides the bug; that's a call only a human should make.
  `playwright-test-healer`'s own instructions cover this (`test.fixme()` + comment when it can't tell).

A single maintenance pass often needs both: heal what broke, generate coverage for what's new.

## Running the agents

Each is a subagent (`Agent` tool, `subagent_type` = the agent's `name` in its frontmatter). Give it
a self-contained prompt — it has no memory of this conversation. The generated
`.claude/prompts/playwright-test-*.md` files show the canonical prompt shape for each; follow that
shape rather than inventing your own.

- **Healer** — `Agent({subagent_type: "playwright-test-healer", prompt: "Run all tests and fix the failing ones.", ...})`,
  or scope it to specific files/tags when you already know what broke (faster, and avoids the healer
  touching unrelated flaky tests in the same run).
- **Planner** — give it the task, the seed file (`tests/app/seed.spec.ts`), and where to save the
  plan (`specs/<name>.plan.md`). It reads existing coverage under `tests/app/` before writing new
  scenarios (see the addendum in its agent file) — don't skip that by planning from scratch yourself.
- **Generator** — one call per scenario in the plan, sequential (not parallel — later scenarios may
  build on earlier ones reusing the same page state). Point it at the plan file and the specific
  bullet.

## After the agents run

1. Re-run the full non-destructive suite (`npm test`) plus `npm run test:destructive` if anything
   touching shared state (BookStore collection mutations, account state) was healed or added —
   don't assume the destructive tier is unaffected just because it wasn't in the failure list.
2. `npm run typecheck && npm run lint && npm run format:check` — the agents write real TypeScript;
   verify it the same way you would your own changes. The enforcement hook blocks the
   mechanically-detectable violations at write-time (including from the generator's
   `generator_write_test` MCP tool — see `.claude/scripts/enforce_constitution.py`), but hook
   silence isn't proof of full Constitution compliance (e.g. "exactly one tag" isn't hook-enforced).
   Skim generated/healed files against `.claude/skills/tagging/SKILL.md` and
   `.claude/skills/page-objects/SKILL.md`.
3. Check for any `test.fixme()` the healer left behind — that's the healer telling you it found a
   likely **application** regression, not a stale test. Surface these explicitly; don't let them
   silently sit skipped.
4. Report what changed: tests healed (and why they broke), tests added (and what they now cover),
   and anything marked `fixme` for human review. Follow the Golden Rule from
   `.claude/skills/ai-native-workflow/SKILL.md` — verify before treating the pass as done.
