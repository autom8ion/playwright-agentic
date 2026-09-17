import { expect, test } from '../../../fixtures/pom/test-options';

test(
    'should navigate from Alerts to Buttons via the shared left-nav menu',
    { tag: '@e2e' },
    async ({ alertsPage, buttonsPage, groupMenuComponent, headerComponent, footerComponent }) => {
        await test.step('GIVEN the Alerts page, with the shared header and footer present', async () => {
            await alertsPage.goto();
            await expect(headerComponent.logoLink).toBeVisible();
            await expect(footerComponent.copyright).toBeVisible();
        });

        await test.step("WHEN navigating to 'Buttons' via the Elements category in the left-nav menu", async () => {
            await groupMenuComponent.navigateTo('Elements', 'Buttons');
        });

        await test.step('THEN the Buttons page is shown, with the same shared header and footer', async () => {
            await expect(buttonsPage.doubleClickButton).toBeVisible();
            await expect(headerComponent.logoLink).toBeVisible();
            await expect(footerComponent.copyright).toBeVisible();
        });
    },
);
