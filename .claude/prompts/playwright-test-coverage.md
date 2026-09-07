---
agent: playwright-orchestrator
description: Produce test coverage (plan → generate per suite → run → heal)
---

Mode: coverage.
Task: <what to cover, e.g. "demoqa Elements > Buttons page: click, double-click, right-click">
Seed: `tests/app/seed.spec.ts`
Plan path: `specs/<kebab-slug>.plan.md`

The orchestrator calls #playwright-test-planner once, #playwright-test-generator once per
`### N.` suite in the plan (sequentially — the MCP browser is shared), then
`npm run test:summary -- <generated files>`, then #playwright-test-healer once with any FAIL
lines, then `npm run format && npm run typecheck && npm run lint`. From the main session this
is just `/coverage <task>`.
