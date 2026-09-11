---
name: pull-requests
description: Pre-PR checklist and description conventions — mirrors this repo's CI gates before you open or update a pull request.
---

# Pull Requests

Before opening or pushing to a PR, run what `.github/workflows/ci.yml` runs,
locally, so CI is a confirmation rather than a first look:

```bash
npm run check:version        # VERSION / package.json / CHANGELOG.md agree
npm run check:skills-drift   # CLAUDE.md's skills index matches .claude/skills/
npm run format:check
npm run lint
npm run typecheck
npm test                     # or the narrower tier your change actually touches
```

CI's `test` job only runs `test:smoke` and `test:api` — if your change
touches `@e2e`, `@regression`, or `@destructive` coverage, run that tier
locally too; CI won't catch a break there.

## Version bump

Only needed if this PR is a release, not for routine feature/fix PRs. If it
is, follow AI-WORKFLOWS.md's "Release a version bump" playbook (`version:stamp`,
a `CHANGELOG.md` entry, then `check:version`) — don't hand-edit `VERSION` or
`package.json`'s version field separately, they have to agree.

## Commit and branch conventions

One prompt → verify → commit, per the Golden Rule (see `CLAUDE.md`) — don't
bundle multiple unrelated, unverified changes into one commit. Commit
messages explain _why_, not a restatement of the diff (see recent history
with `git log`). Branch off `main`; there's no enforced naming scheme beyond
that.

## Code review before opening

The checklist above is entirely mechanical (lint/typecheck/format/version
agreement, same as the constitution hooks catch at write time) — none of it
reads the diff for an actual logic bug, a missed edge case, or code that
could be simpler. Once the checklist is green, run `/code-review` on the
branch to catch what the mechanical gates structurally can't. Pick an effort
level for the size of the change (a small fix doesn't need `high`; a new
page object or a pipeline change like the healer/orchestrator work
benefits from it); omit the level to reuse whatever you last used. `--fix`
applies straightforward findings directly, but re-run the checklist above
afterward since a fix can touch formatting, a test, or a locator again.
This is a step you run yourself before opening/updating the PR — it isn't
wired into CI, matching this repo's preference for human-triggered review
over automatic/unattended steps.

## Opening/updating the PR

Pushing a branch and opening a PR are visible-to-others actions — confirm
with the user first unless they've already asked for it in this conversation
(see the repo-wide "Executing actions with care" guidance). PR descriptions
should carry a short summary of _why_, plus a test-plan checklist covering
what you verified locally from the list above — not a restatement of the
commit log.
