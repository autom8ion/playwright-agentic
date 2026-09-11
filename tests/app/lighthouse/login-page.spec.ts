import { existsSync } from 'node:fs';
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Lighthouse audit', () => {
    test(
        'should meet baseline quality thresholds and persist a report for the Login page',
        { tag: '@regression' },
        async ({ loginPage, resetStorageState, lighthouseAudit }) => {
            await test.step('GIVEN a logged-out session on the Login page', async () => {
                await resetStorageState();
                await loginPage.goto();
                await expect(loginPage.loginButton).toBeVisible();
            });

            let reportPaths: { html: string; json: string };

            await test.step('WHEN running a Lighthouse audit against it', async () => {
                reportPaths = await lighthouseAudit('login');
            });

            await test.step('THEN an HTML and a JSON report are persisted to disk', async () => {
                expect(existsSync(reportPaths.html)).toBe(true);
                expect(existsSync(reportPaths.json)).toBe(true);
            });
        },
    );
});
