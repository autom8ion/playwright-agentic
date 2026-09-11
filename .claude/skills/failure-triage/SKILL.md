---
name: failure-triage
description: Classify a failing Playwright test as flaky, a stale-test defect, a real product regression, or a narrower cause (auth/session, environment/config, CI infra), with evidence, before deciding whether to heal, stabilize, or report it.
---

# Failure Triage

A failing test is not automatically "the test is wrong." Before healing anything, decide _what kind_
of failure this is — this skill is the protocol for that decision, run via the
`playwright-test-triager` agent (`.claude/agents/playwright-test-triager.md`, backed by the
`playwright-test` MCP server). It replaces guessing with a repeatable, evidence-based process, and
routes to one of a handful of downstream paths depending on the verdict — a fix agent (healer or
stabilizer), the orchestrator regenerating a shared session itself, or a human report.

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
      label text, an incidental value, or — for `@api` tests — a response schema in
      `test-data/schemas/*.ts` that hasn't caught up with an added/renamed/retyped field) are stale.
    - **PRODUCT REGRESSION** — the flow itself is broken (missing element, thrown error, unexpected
      4xx/5xx, a new console error, a step that no longer completes). Before landing here, check
      `.claude/skills/app-notes/SKILL.md` for a documented quirk matching what you're seeing (Web
      Tables Edit/Delete icon role instability, Alerts result-elements-don't-exist-until-first-use,
      Buttons' regenerated third-button id, demoqa's confirmed bulk-delete 401 bug) — a matching
      quirk means the test needs to account for known behavior, not that the app broke.
    - **FLAKY** — nondeterministic result, or a deterministic-looking failure whose cause is
      race/timing/isolation rather than either of the above. A shared-resource mutation (the
      bookstore collection, `apiSession`, a shared factory record) missing a matching `lock:`
      option is a first-class, easy-to-spot sub-cause — name the resource and the missing lock
      explicitly rather than just saying "flaky."
    - **AUTH SESSION EXPIRED** — a deterministic 401/403, a "not authorized" page state, or a
      token/expiry-shaped console error on an authenticated flow. Not TEST DEFECT (nothing about
      the test's mechanics is wrong) and not FLAKY (it's deterministic) — it needs the shared
      demoqa session regenerated, which is an orchestrator action (`playwright-orchestrator` runs
      `--project=setup`), not a leaf-agent fix.
    - **ENV CONFIG FAILURE** — the evidence is the explicit `Missing required environment variable:
X` error thrown by `config/env.ts`, or (weaker signal — note it as a caveat, not a confident
      finding) requests going to an unexpected host because `BASE_URL`/`API_URL` silently fell back
      to production. Never edit `env/.env` or a CI secret yourself; report it.
    - **CI INFRA FAILURE** — not a per-test failure at all: a job/pipeline-level failure (a
      blob-report merge failure, a `setup:user` demoqa signup 429/500, a `check:version` /
      `check:skills-drift` / `check:hook` governance-gate failure) that happens before or outside
      any test running. See "CI-infra failures" below — it's never discovered by the normal
      reproduce/evidence loop above.
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
- **AUTH SESSION EXPIRED** → not a leaf agent. `playwright-orchestrator` regenerates storage state
  itself (`npx playwright test --project=setup`) and re-verifies once.
- **ENV CONFIG FAILURE** → report-only, same convention as PRODUCT REGRESSION — a human fixes
  `env/.env` or a CI secret; no agent touches it.
- **CI INFRA FAILURE** → report-only; see "CI-infra failures" below for how it's even reached.
- **AMBIGUOUS** → stop and ask the user. Triage narrows this case, it doesn't eliminate it —
  forcing a verdict here is worse than admitting the evidence doesn't decide it.

## CI-infra failures (a human hands you a CI log, not a FAIL line)

This protocol's reproduce-3×-then-gather-evidence loop assumes a `FAIL <file> :: <title>` line
from a local `test:summary` run. Some failures never produce one: a blob-report merge failure, a
`setup:user` demoqa signup 429/500, or a `check:version`/`check:skills-drift`/`check:hook`
governance-gate failure are job/pipeline-level — they happen before or outside any test running,
so `/heal`'s fresh local `test:summary` never surfaces them (it never trusts stale CI artifacts).
If a human pastes or describes one of these instead of a FAIL line, skip the reproduce/evidence
steps — there's no test to rerun — and classify it directly as **CI INFRA FAILURE**: report which
job/step failed and the supplied log excerpt as evidence, and stop. This is always a human
decision (rerun the job, fix the workflow, fix a secret); no agent acts on it.

## Constitution compliance

The triager has no `Edit`/`Write`/`MultiEdit` tools by design — it classifies, it doesn't fix. If a
report reads like it's proposing a code change, that's a sign the agent has drifted from its role;
route the actual fix through the healer or stabilizer instead. It has `agent-conventions`,
`app-notes`, and this skill preloaded, so its prompt only needs the failure lines.
