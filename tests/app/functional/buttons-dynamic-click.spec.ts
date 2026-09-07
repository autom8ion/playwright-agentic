// spec: specs/buttons.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Buttons', () => {
    test(
        "should show the dynamic click confirmation message when single-clicking the third, dynamically-id'd Click Me button",
        { tag: '@sanity' },
        async ({ buttonsPage }) => {
            await test.step('GIVEN the Buttons page', async () => {
                await buttonsPage.goto();
                await expect(buttonsPage.dynamicClickButton).toBeVisible();
                await expect(buttonsPage.dynamicClickMessage).toBeHidden();
            });

            await test.step('WHEN single-clicking the exact-name Click Me button', async () => {
                await buttonsPage.dynamicClick();
            });

            await test.step('THEN the dynamic-click confirmation message appears', async () => {
                await expect(buttonsPage.dynamicClickMessage).toBeVisible();
            });
        },
    );
});
