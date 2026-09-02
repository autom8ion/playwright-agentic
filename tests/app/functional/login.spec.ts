import { expect, test } from '../../../fixtures/pom/test-options';
import { INVALID_CREDENTIALS } from '../../../test-data/static/invalid-values';

test.describe('Login', () => {
    for (const { userName, password, label } of INVALID_CREDENTIALS) {
        test(`should reject login with ${label}`, { tag: '@sanity' }, async ({ loginPage, resetStorageState }) => {
            await test.step('GIVEN a logged-out session', async () => {
                await resetStorageState();
            });

            await test.step('WHEN submitting invalid credentials', async () => {
                await loginPage.goto();
                await loginPage.login(userName, password);
            });

            await test.step('THEN an invalid-credentials error is shown', async () => {
                await expect(loginPage.invalidCredentialsMessage).toBeVisible();
            });
        });
    }
});
