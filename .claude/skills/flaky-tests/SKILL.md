---
name: flaky-tests
description: Find chronically-flaky tests (via CI history and local repeat-each reruns) and stabilize their root cause — races, isolation, ordering, or timing — rather than just tolerating CI's retries.
---

# Flaky Tests

CI already sets `retries: 2` (`playwright.config.ts`) and emits a CTRF report whose `flaky`/`retries`
fields tell you exactly which tests needed a retry to pass — but nothing acts on that signal today.
This skill is for actually finding and fixing flaky tests instead of letting retries quietly mask
them, via the `playwright-flaky-stabilizer` agent (`.claude/agents/playwright-flaky-stabilizer.md`).

## Two entry points

- **Reactive** — `.claude/skills/failure-triage/SKILL.md` already classified a specific test as
  FLAKY. Skip straight to "Stabilizing a known-flaky test" below.
- **Proactive** — periodic or on-demand sweep to catch chronic offenders before someone hits them as
  a one-off failure. Use "Finding chronic offenders" below first.

## Finding chronic offenders

CI already uploads per-run CTRF/JUnit artifacts (`.github/workflows/ci.yml`) consumed by the
KPI-Dashboard; reuse them here instead of re-instrumenting anything:

```bash
# Recent runs of the CI workflow
gh run list --workflow=ci.yml --json databaseId,conclusion,createdAt -L 20

# Pull each run's CTRF report (per-test flaky/retries fields)
gh run download <run-id> -n ctrf-report -D /tmp/ctrf-<run-id>

# Aggregate: which tests were flaky in more than one recent run?
jq -r '.results.tests[] | select(.flaky == true) | .name' /tmp/ctrf-*/ctrf-report.json | sort | uniq -c | sort -rn

# Or the one-run digest in the same shape agents expect (FLAKY <file> :: <title> :: (passed on retry N))
npm run test:summary -- --from-ctrf /tmp/ctrf-<run-id>/ctrf-report.json
```

A test flaky in **2 or more** of the last ~20 runs is a chronic offender worth fixing — a single
flaky occurrence can be noise (a genuinely transient network blip against the live demoqa.com
target); a repeat pattern is not. For each chronic offender, hand it to the stabilizer:

```
Agent({
  subagent_type: "playwright-flaky-stabilizer",
  prompt: "Stabilize <file> — CTRF history shows it flaky in N of the last 20 CI runs. Confirm,
           find the root cause, fix it, and verify with repeated runs.",
})
```

## Stabilizing a known-flaky test

The `playwright-flaky-stabilizer` agent works through root causes in this order — the same checklist
is in its agent file, repeated here so you can sanity-check its report:

1. **Race / missing web-first wait** — see `.claude/skills/locators-assertions/SKILL.md`.
2. **Shared/leaking state** — a test mutating data another concurrent test depends on without being
   tagged `@destructive` (`.claude/skills/tagging/SKILL.md`).
3. **Order dependence** — assuming state left by another test instead of owning its own
   factory-generated data (`.claude/skills/data-strategy/SKILL.md`).
4. **Auth/session races under `fullyParallel`** — a test invalidating shared storage state another
   parallel test still needs (`.claude/skills/auth-storage-state/SKILL.md`).
5. **Inherent target-app nondeterminism** — only concluded after ruling out 1–4; flagged explicitly
   rather than assumed.

## Verification is stricter here than a normal heal

One green run proves nothing for a flaky test. The stabilizer verifies with repeated runs
(`--repeat-each=10` or more, matched to how often the flake originally showed up) before reporting
success — don't accept "it passed once" as done, from the agent or from your own spot-check.

## After stabilizing

1. Re-run the target test with `--repeat-each` one more time yourself as a final check
   (`npm run test:summary -- <file> --repeat-each=10`), plus the relevant tier to confirm nothing
   else regressed.
2. `npm run typecheck && npm run lint && npm run format:check` — same as any other agent-written
   change (see `.claude/skills/maintenance/SKILL.md`'s "After the agents run").
3. If the stabilizer left a `test.fixme()` because it couldn't reach determinism, surface that
   explicitly — don't let it sit silently skipped, same as a healer-left `fixme()`.
