---
name: ai-native-workflow
description: The router for any non-trivial change — plan with confidence/rationale/unknowns before writing code, explore before generating page objects, verify before moving on.
---

# AI-Native Workflow

This is the sole router for non-trivial work in this repo (a new test, a new
page object, a fixture change, anything that isn't a one-line fix). Trivial
mechanical edits (fixing a typo, renaming per an explicit instruction) don't
need this ceremony.

## Before writing code

State, briefly:

- **Confidence (1–10)** — how sure you are this plan is correct without
  having run it.
- **Rationale** — why this approach, in one or two sentences.
- **Unknowns** — what you haven't verified (a locator you haven't confirmed
  exists, an API response shape you're inferring rather than having seen).

**If confidence < 5, stop and ask the human** rather than guessing. A wrong
guess that gets written, committed, and only fails in CI costs more than a
clarifying question up front.

## Explore before generating

Before creating or editing a page object or a UI test, open the real page
with the `playwright-cli` skill (`npx playwright cli open <url>` then
`npx playwright cli snapshot`) and confirm the locators you're about to
write actually resolve, uniquely, against the live accessibility tree.
Never invent a `getByRole` name, `getByPlaceholder` string, or CSS fallback
from memory or by guessing at conventional naming — read it off the
snapshot. See `.claude/skills/playwright-cli/SKILL.md` for the full command
set (clicking, filling, network/console inspection). If exploration itself
fails (page unreachable, tool unavailable), stop and tell the human; don't
substitute a different, unverified approach.

This is separate from the plan/generate/heal agents, which explore and
write tests through their own MCP browser tools — reach for `playwright-cli`
yourself for a quick one-off check; delegate to an agent (see
`.claude/skills/maintenance/SKILL.md`) for a full scenario worth of work.

## The golden rule: Verify → Commit → Proceed

Each AI-assisted change is one prompt → review the diff → run the relevant
test tier (`npm run test:smoke`, `test:api`, whichever applies) → commit
working code → move to the next prompt. Don't pile a second unverified
change on top of a first one that hasn't been checked.

## When the enforcement hook blocks you

`.claude/scripts/enforce_constitution.py` blocks a handful of
mechanically-detectable anti-patterns (see `CLAUDE.md`) before the write
lands. If a write gets blocked, that's not a bug to route around — it's the
Constitution telling you the approach itself needs to change (use the
suggested alternative in the hook's message), not a signal to find a
workaround that dodges the pattern-match.
