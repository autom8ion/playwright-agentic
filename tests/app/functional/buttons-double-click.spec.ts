// spec: specs/buttons.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Buttons', () => {
    test(
        'should show the double-click confirmation message when double-clicking the Double Click Me button',
        { tag: '@sanity' },
        async ({ buttonsPage }) => {
            await test.step('GIVEN the Buttons page', async () => {
                await buttonsPage.goto();
                await expect(buttonsPage.doubleClickButton).toBeVisible();
                await expect(buttonsPage.rightClickButton).toBeVisible();
                await expect(buttonsPage.dynamicClickButton).toBeVisible();
                await expect(buttonsPage.doubleClickMessage).toBeHidden();
            });

            await test.step('WHEN double-clicking the Double Click Me button', async () => {
                await buttonsPage.doubleClick();
            });

            await test.step('THEN the double-click confirmation message appears', async () => {
                await expect(buttonsPage.doubleClickMessage).toBeVisible();
            });
        },
    );
});
