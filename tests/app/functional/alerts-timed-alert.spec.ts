// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Alerts', () => {
    test(
        'should show an alert with the delayed message after a ~5 second delay when clicking the timer alert button',
        { tag: '@regression' },
        async ({ alertsPage }) => {
            await test.step("GIVEN the Alerts page, on the 'On button click, alert will appear after 5 seconds' section", async () => {
                await alertsPage.goto();
                await expect(alertsPage.timerAlertButton).toBeVisible();
            });

            let dialogMessage = '';

            await test.step("WHEN clicking that button and racing the click against page.waitForEvent('dialog', { timeout: 10_000 }) the same way triggerTimerAlert() does, so the dialog is awaited without a fixed sleep even though it only appears after the ~5s delay", async () => {
                dialogMessage = await alertsPage.triggerTimerAlert();
                expect(dialogMessage).toBe('This alert appeared after 5 seconds');
            });

            await test.step('THEN the dialog is accepted and the page returns to a stable, interactable state with no residual dialog', async () => {
                await expect(alertsPage.timerAlertButton).toBeVisible();
                await expect(alertsPage.timerAlertButton).toBeEnabled();
            });
        },
    );
});
