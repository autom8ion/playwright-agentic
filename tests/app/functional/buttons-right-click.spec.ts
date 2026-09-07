// spec: specs/buttons.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Buttons', () => {
    test(
        'should show the right-click confirmation message when right-clicking the Right Click Me button',
        { tag: '@sanity' },
        async ({ buttonsPage }) => {
            await test.step('GIVEN the Buttons page', async () => {
                await buttonsPage.goto();
                await expect(buttonsPage.rightClickButton).toBeVisible();
                await expect(buttonsPage.rightClickMessage).toBeHidden();
            });

            await test.step('WHEN right-clicking the Right Click Me button', async () => {
                await buttonsPage.rightClick();
            });

            await test.step('THEN the right-click confirmation message appears', async () => {
                await expect(buttonsPage.rightClickMessage).toBeVisible();
            });
        },
    );
});
