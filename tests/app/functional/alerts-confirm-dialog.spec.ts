// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Alerts', () => {
    test(
        'should record the correct result text for both accepting and dismissing the confirm dialog',
        { tag: '@sanity' },
        async ({ alertsPage }) => {
            await test.step("GIVEN the Alerts page, on the 'confirm box will appear' section", async () => {
                await alertsPage.goto();
                await expect(alertsPage.confirmButton).toBeVisible();
                await expect(alertsPage.confirmResultText).toHaveCount(0);
            });

            await test.step('WHEN clicking the button and accepting the resulting confirm dialog', async () => {
                await alertsPage.triggerConfirm('accept');
                await expect(alertsPage.confirmResultText).toHaveText('You selected Ok');
            });

            await test.step('AND clicking the button again and dismissing (Cancel) the confirm dialog this time', async () => {
                await alertsPage.triggerConfirm('dismiss');
                await expect(alertsPage.confirmResultText).toHaveText('You selected Cancel');
            });
        },
    );
});
