---
name: heal
description: /heal [file | @tag] — fix failing Playwright tests by delegating summarize → triage → heal/stabilize to the playwright-orchestrator subagent and relaying its short report.
---

# /heal

Fixes failures without hand-driving agents from this session. The orchestrator runs
`npm run test:summary` on the scope, triages anything not obviously stale, sends TEST DEFECT
verdicts to the healer and FLAKY ones to the stabilizer, regenerates the shared auth session
itself for an AUTH SESSION EXPIRED verdict (including the systemic check it runs before triage
even starts), leaves PRODUCT REGRESSION / ENV CONFIG FAILURE / CI INFRA FAILURE / AMBIGUOUS
untouched, and re-runs the summary plus repo checks.

## Do exactly this

1. One call:

    ```
    Agent({
      subagent_type: "playwright-orchestrator",
      description: "heal pipeline",
      prompt: "Mode: heal. Scope: <files or @tag from $ARGUMENTS, or 'whole non-destructive suite'>. <Add 'Failures are obviously stale mechanics — skip triage.' only if the user said so.>"
    })
    ```

2. Relay the final report as-is. Anything under "Needs a human" (a PRODUCT REGRESSION, ENV
   CONFIG FAILURE, or CI INFRA FAILURE verdict, a `fixme` left behind, AMBIGUOUS) goes first —
   those are the findings, not the green tests.
3. Stop. The user reviews `git diff` and commits.

Scope tightly when you can (a file, a tag): triage is per failure, and a full-suite run against
the live demoqa target is the slowest step.
