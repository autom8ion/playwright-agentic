---
name: failure-triage
description: Classify a failing Playwright test as flaky, a stale-test defect, or a real product regression, with evidence, before deciding whether to heal, stabilize, or report it.
---

# Failure Triage

A failing test is not automatically "the test is wrong." Before healing anything, decide _what kind_
of failure this is — this skill is the protocol for that decision, run via the
`playwright-test-triager` agent (`.claude/agents/playwright-test-triager.md`, backed by the
`playwright-test` MCP server). It replaces guessing with a repeatable, evidence-based process, and
feeds three different downstream paths depending on the verdict.

## When to reach for this

- A test fails and it isn't obviously either "same scenario, stale mechanics" or "the scenario no
  longer exists" (see `.claude/skills/maintenance/SKILL.md`'s heal-vs-plan+generate decision — those
  two cases don't need triage, this skill is for everything else).
- You suspect a test might be flaky rather than genuinely broken.
- You want evidence before telling a human "this looks like a real bug," not just a hunch.

## Running the triager

```
Agent({
  subagent_type: "playwright-test-triager",
  prompt: "Triage the failing test(s) in <file/tag>. Classify each as flaky, a test defect, or a
           product regression, with evidence.",
})
```

Give it the `FAIL <file> :: <title> :: <cause>` lines from `npm run test:summary -- <scope>`
rather than the whole suite — triage is per-failure, and scoping it avoids the agent re-discovering
what already failed. `/heal <scope>` does this routing for you via the orchestrator.

## The protocol (what the triager does)

1. **Reproduce in isolation, no code changes** — rerun the failing test 3× on its own. Inconsistent
   results across those runs is sufficient on its own to call it **FLAKY**; stop there.
2. **If deterministic, gather evidence** — trace actions/snapshot at the failure point (see
   `.claude/skills/playwright-trace/SKILL.md`), console messages, network requests, and a live
   comparison against the real app.
3. **Classify from the evidence:**
    - **TEST DEFECT** — the flow still works and matches intent; only the test's mechanics (selector,
      label text, an incidental value) are stale.
    - **PRODUCT REGRESSION** — the flow itself is broken (missing element, thrown error, unexpected
      4xx/5xx, a new console error, a step that no longer completes).
    - **FLAKY** — nondeterministic result, or a deterministic-looking failure whose cause is
      race/timing/isolation rather than either of the above.
    - **AMBIGUOUS** — evidence doesn't clearly support one verdict. Reported honestly, not forced.

## After the triager reports

Route each verdict:

- **FLAKY** → `.claude/skills/flaky-tests/SKILL.md`, `playwright-flaky-stabilizer` agent.
- **TEST DEFECT** → `playwright-test-healer` agent (existing, unchanged) — the triager has already
  done the diagnosis, so point the healer at the specific test rather than a full-suite run.
- **PRODUCT REGRESSION** → do not fix the test. Add `test.fixme()` with a comment summarizing the
  triager's evidence (same convention the healer already uses for cases it can't resolve), and
  surface the finding to the user explicitly — this repo's convention is report-only; filing an
  issue or deciding next steps is a human call, not something an agent does automatically.
- **AMBIGUOUS** → stop and ask the user. Triage narrows this case, it doesn't eliminate it —
  forcing a verdict here is worse than admitting the evidence doesn't decide it.

## Constitution compliance

The triager has no `Edit`/`Write`/`MultiEdit` tools by design — it classifies, it doesn't fix. If a
report reads like it's proposing a code change, that's a sign the agent has drifted from its role;
route the actual fix through the healer or stabilizer instead. It has `agent-conventions`,
`app-notes`, and this skill preloaded, so its prompt only needs the failure lines.
