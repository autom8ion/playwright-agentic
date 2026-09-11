import { existsSync } from 'node:fs';
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Lighthouse audit', () => {
    test(
        'should meet baseline quality thresholds and persist a report for the Buttons page',
        { tag: '@regression' },
        async ({ buttonsPage, lighthouseAudit }) => {
            await test.step('GIVEN the Buttons page has loaded', async () => {
                await buttonsPage.goto();
                await expect(buttonsPage.doubleClickButton).toBeVisible();
            });

            let reportPaths: { html: string; json: string };

            await test.step('WHEN running a Lighthouse audit against it', async () => {
                reportPaths = await lighthouseAudit('buttons');
            });

            await test.step('THEN an HTML and a JSON report are persisted to disk', async () => {
                expect(existsSync(reportPaths.html)).toBe(true);
                expect(existsSync(reportPaths.json)).toBe(true);
            });
        },
    );
});
