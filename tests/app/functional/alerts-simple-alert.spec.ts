// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Alerts', () => {
    test(
        'should show a plain alert with the expected message and accept it',
        { tag: '@sanity' },
        async ({ alertsPage }) => {
            await test.step('GIVEN a new AlertsPage page object navigates to https://demoqa.com/alerts', async () => {
                await alertsPage.goto();
                await expect(alertsPage.alertSectionLabel).toBeVisible();
                await expect(alertsPage.alertButton).toBeVisible();
            });

            let dialogMessage = '';

            await test.step("WHEN clicking that button and racing the click against page.waitForEvent('dialog') the same way BookStorePage.addCurrentBookToCollection does", async () => {
                dialogMessage = await alertsPage.triggerAlert();
                expect(dialogMessage).toBe('You clicked a button');
            });

            await test.step('THEN the dialog is accepted and the page returns to a stable, interactable state with no residual dialog', async () => {
                await expect(alertsPage.alertButton).toBeVisible();
                await expect(alertsPage.alertButton).toBeEnabled();
            });
        },
    );
});
