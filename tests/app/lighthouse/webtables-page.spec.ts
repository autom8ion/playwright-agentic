import { existsSync } from 'node:fs';
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Lighthouse audit', () => {
    test(
        'should meet baseline quality thresholds and persist a report for the Web Tables page',
        { tag: '@regression' },
        async ({ webTablesPage, lighthouseAudit }) => {
            await test.step('GIVEN the Web Tables page has loaded', async () => {
                await webTablesPage.goto();
                await expect(webTablesPage.addButton).toBeVisible();
            });

            let reportPaths: { html: string; json: string };

            await test.step('WHEN running a Lighthouse audit against it', async () => {
                reportPaths = await lighthouseAudit('webtables');
            });

            await test.step('THEN an HTML and a JSON report are persisted to disk', async () => {
                expect(existsSync(reportPaths.html)).toBe(true);
                expect(existsSync(reportPaths.json)).toBe(true);
            });
        },
    );
});
