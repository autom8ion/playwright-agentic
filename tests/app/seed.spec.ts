import { expect, test } from '../../fixtures/pom/test-options';

// Seed file for the Playwright plan/generate/heal agents (see
// .claude/agents/playwright-test-*.md and .claude/skills/maintenance) —
// planner_setup_page/generator_setup_page run this to reach a known-good
// starting state before exploring. Also doubles as a real smoke check.
test('seed', { tag: '@smoke' }, async ({ bookStorePage }) => {
    await test.step('GIVEN the Book Store page', async () => {
        await bookStorePage.goto();
    });

    await test.step('THEN the app has loaded', async () => {
        await expect(bookStorePage.searchBox).toBeVisible();
    });
});
