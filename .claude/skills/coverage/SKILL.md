---
name: coverage
description: /coverage <what to cover> — add test coverage for a feature or page by delegating the whole plan → generate → run → heal pipeline to the playwright-orchestrator subagent and relaying its short report.
---

# /coverage

Adds coverage end to end without pulling agent chatter into this session. The orchestrator
(`.claude/agents/playwright-orchestrator.md`) runs the planner once, the generator once per
suite, the summary script, a scoped heal if needed, and the repo checks.

## Do exactly this

1. One call:

    ```
    Agent({
      subagent_type: "playwright-orchestrator",
      description: "coverage pipeline",
      prompt: "Mode: coverage. Task: <the user's request, verbatim>. Seed: tests/app/seed.spec.ts. Plan path: specs/<kebab-slug>.plan.md."
    })
    ```

2. Relay the orchestrator's final report to the user as-is (it is ≤ 40 lines). Do not re-run
   the tests, do not read the generated files, do not summarize the summary.
3. If the report says PARTIAL/BLOCKED or lists anything under "Needs a human", say so first.
4. Stop. The user reviews `git diff` and commits (Golden rule: verify → commit → proceed). Only
   run `npm test` yourself if the user asks for an independent check.

If `$ARGUMENTS` is empty, ask what to cover; do not guess a feature.
