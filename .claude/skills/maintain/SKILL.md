---
name: maintain
description: /maintain [what changed in the app] — run a full proactive maintenance pass (status, heal, optional coverage, audits for dead scenarios / orphaned locators / fixme / chronic flakes) by delegating to the playwright-maintainer subagent and relaying its report.
---

# /maintain

The periodic or after-a-release pass. One call to `playwright-maintainer`
(`.claude/agents/playwright-maintainer.md`), which runs the suite summaries, hands failures to
the orchestrator's heal mode, extends coverage for anything you describe, and audits for things
only a human should decide on (deleting scenarios, orphaned locators, leftover `fixme()`s,
chronic CI flakes).

## Do exactly this

1. One call:

    ```
    Agent({
      subagent_type: "playwright-maintainer",
      description: "maintenance pass",
      prompt: "Maintenance pass. App changes to cover: <$ARGUMENTS, or 'none described'>."
    })
    ```

2. Relay the report as-is. Lead with "Delete candidates", "Leftover fixme()", and anything the
   heal step marked "Needs a human" — those are decisions for the user, not things to act on.
3. Stop. The user reviews `git diff`, decides on deletions, and commits.

Nesting note: main → maintainer → orchestrator → leaf agent is three layers, the default
`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`. Don't lower that setting below 3 in this repo.
