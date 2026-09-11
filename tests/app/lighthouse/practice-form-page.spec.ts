import { existsSync } from 'node:fs';
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Lighthouse audit', () => {
    test(
        'should meet baseline quality thresholds and persist a report for the Practice Form page',
        { tag: '@regression' },
        async ({ practiceFormPage, lighthouseAudit }) => {
            await test.step('GIVEN the Practice Form page has loaded', async () => {
                await practiceFormPage.goto();
                await expect(practiceFormPage.firstNameInput).toBeVisible();
            });

            let reportPaths: { html: string; json: string };

            await test.step('WHEN running a Lighthouse audit against it', async () => {
                reportPaths = await lighthouseAudit('practice-form');
            });

            await test.step('THEN an HTML and a JSON report are persisted to disk', async () => {
                expect(existsSync(reportPaths.html)).toBe(true);
                expect(existsSync(reportPaths.json)).toBe(true);
            });
        },
    );
});
