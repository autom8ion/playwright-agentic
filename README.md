# playwright-agentic

A Claude Code–native Playwright + TypeScript testing scaffold, modeled on
idavidov13/agentic-playwright: instead of teaching Claude how to write tests
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

| Command                         | What it runs                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm test`                      | everything except `@destructive`                                                                 |
| `npm run test:smoke`            | `@smoke`-tagged tests only                                                                       |
| `npm run test:api`              | `@api`-tagged tests only                                                                         |
| `npm run test:e2e`              | `@e2e`-tagged tests only                                                                         |
| `npm run test:destructive`      | `@destructive`-tagged tests, single worker                                                       |
| `npm run test:ui`               | Playwright's interactive UI mode                                                                 |
| `npm run test:headed`           | full suite with a visible browser                                                                |
| `npm run explore -- open <url>` | drive a real browser from the CLI to check locators before writing them (`playwright-cli` skill) |
| `npm run lint` / `lint:fix`     | ESLint (includes `eslint-plugin-playwright`)                                                     |
| `npm run typecheck`             | `tsc --noEmit`                                                                                   |
| `npm run check:version`         | VERSION / package.json / CHANGELOG.md agree                                                      |
| `npm run check:skills-drift`    | CLAUDE.md's skills index matches `.claude/skills/`                                               |

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

Five Playwright-provided subagents (`.claude/agents/playwright-*.md`,
via the `playwright-test` MCP server in `.mcp.json`) explore and write/fix
tests against the real running app: a **planner** that scopes coverage into
`specs/*.plan.md`, a **generator** that turns each scenario into a real spec
file, a **healer** that diagnoses and fixes failing tests, a **triager** that
classifies a failure as flaky/test-defect/product-regression before anything
touches it, and a **flaky stabilizer** that fixes a test's nondeterminism and
verifies with repeated runs. All five carry this repo's conventions, not
generic Playwright output. For your own one-off exploration (not a full agent
run), use `playwright-cli` directly — see the command table above.
`.claude/skills/maintenance/SKILL.md` is the router for when to reach for
which; `.claude/skills/failure-triage/SKILL.md` and
`.claude/skills/flaky-tests/SKILL.md` cover the triager/stabilizer.

## Adapting this to a real app

This scaffold is demo'd against demoqa.com so it's runnable out of the box.
To point it at a different app: update `BASE_URL`/`API_URL` in
`env/.env.example`, replace `helpers/auth.ts` and `tests/app/auth.setup.ts`
with that app's real login flow, and replace the `pages/`, `enums/endpoints.ts`,
and `test-data/schemas/` contents — the Constitution, skills, fixtures chain,
and enforcement hook all carry over unchanged.
