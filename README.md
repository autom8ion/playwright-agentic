# playwright-agentic

A Claude Code–native Playwright + TypeScript testing scaffold, modeled on
[idavidov13/agentic-playwright](https://github.com/idavidov13/agentic-playwright):
instead of teaching Claude how to write tests
in every prompt, the rules live in the repo — a **Constitution** (`CLAUDE.md`), topic **Skills**
(`.claude/skills/*/SKILL.md`), and a **PreToolUse hook**
(`.claude/scripts/enforce_constitution.py`) that mechanically blocks the
cheap-to-detect anti-patterns before Claude ever writes them.

The example app wired up here is [demoqa.com](https://demoqa.com)'s Book
Store (a public site built for test automation practice) — real UI login,
a real token-based REST API, and a per-user book collection, which exercises
the Page Object, fixture, API/Zod, and auth-storage-state layers end to end.

## Quick start

```bash
npm install
npx playwright install chromium
cp env/.env.example env/.env
npm run setup:user      # creates two demoqa test accounts, fills in env/.env
npm test                # full suite, excludes @destructive
```

## Common commands

| Command                          | What it runs                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm test`                       | everything except `@destructive`                                                                 |
| `npm run test:smoke`             | `@smoke`-tagged tests only                                                                       |
| `npm run test:api`               | `@api`-tagged tests only                                                                         |
| `npm run test:e2e`               | `@e2e`-tagged tests only                                                                         |
| `npm run test:destructive`       | `@destructive`-tagged tests, single worker                                                       |
| `npm run test:ui`                | Playwright's interactive UI mode                                                                 |
| `npm run test:summary -- <args>` | run tests and print a ≤ 40-line digest (one line per failure) — what agents and reports consume  |
| `npm run test:headed`            | full suite with a visible browser                                                                |
| `npm run explore -- open <url>`  | drive a real browser from the CLI to check locators before writing them (`playwright-cli` skill) |
| `npm run lint` / `lint:fix`      | ESLint (includes `eslint-plugin-playwright`)                                                     |
| `npm run typecheck`              | `tsc --noEmit`                                                                                   |
| `npm run check:version`          | VERSION / package.json / CHANGELOG.md agree                                                      |
| `npm run check:skills-drift`     | CLAUDE.md's skills index matches `.claude/skills/`                                               |
| `npm run check:hook`             | self-test of the Constitution enforcement hook                                                   |

## Layout

```
.claude/             Constitution support: skills/, agents/, prompts/, enforcement hook
config/               env.ts — typed access to env/.env
enums/                endpoints, messages, tags — no magic strings
fixtures/pom/         test-options.ts — the only import point for specs
helpers/              auth.ts — API helpers shared by setup + scripts
pages/                Page Object Model classes
specs/                Test plans written by the planner agent
test-data/            factories/ (Faker), static/ (as const), schemas/ (Zod)
tests/app/            functional/, api/, e2e/, auth.setup.ts, seed.spec.ts
scripts/              setup-test-user, version/skills-drift checks
```

Start with `CLAUDE.md` for the rules and `AI-WORKFLOWS.md` for step-by-step
playbooks (add a test, add a page object, add an API test, ...).

Three slash commands drive the agentic workflow: **`/coverage <what to cover>`**
(plan → generate → run → heal), **`/heal [file|@tag]`** (summarize →
triage → heal/stabilize), and **`/maintain [what changed]`** (a full pass:
both suite tiers, heal, coverage, and audits for dead scenarios, orphaned
locators, leftover `fixme()`s, and chronic CI flakes, via the
`playwright-maintainer` subagent). The first two make a single call to the
`playwright-orchestrator` subagent, which coordinates five leaf agents
(`.claude/agents/playwright-*.md`, via the `playwright-test` MCP server in
`.mcp.json`) against the real running app — a **planner**, a per-suite
**generator**, a **healer**, a **triager**, and a **flaky stabilizer** — and
returns one short report. The leaf agents preload a compact conventions card
and a file of verified app facts instead of re-reading the skills each run,
are turn-capped, and are backed by three hooks (block banned patterns at
write time, feed eslint/tsc errors back on the same turn, refuse to let a
writer agent stop with a red typecheck). For your own one-off exploration,
use `playwright-cli` directly — see the command table above.
`.claude/skills/maintenance/SKILL.md` is the router for when to reach for
which.

## Adapting this to a real app

This scaffold is demo'd against demoqa.com so it's runnable out of the box.
To point it at a different app: update `BASE_URL`/`API_URL` in
`env/.env.example`, replace `helpers/auth.ts` and `tests/app/auth.setup.ts`
with that app's real login flow, and replace the `pages/`, `enums/endpoints.ts`,
and `test-data/schemas/` contents — the Constitution, skills, fixtures chain,
and enforcement hook all carry over unchanged.
