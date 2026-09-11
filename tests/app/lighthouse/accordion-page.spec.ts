import { existsSync } from 'node:fs';
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Lighthouse audit', () => {
    test(
        'should meet baseline quality thresholds and persist a report for the Accordion page',
        { tag: '@regression' },
        async ({ accordionPage, lighthouseAudit }) => {
            await test.step('GIVEN the Accordion page has loaded', async () => {
                await accordionPage.goto();
                await expect(accordionPage.sectionHeader('What is Lorem Ipsum?')).toBeVisible();
            });

            let reportPaths: { html: string; json: string };

            await test.step('WHEN running a Lighthouse audit against it', async () => {
                reportPaths = await lighthouseAudit('accordion');
            });

            await test.step('THEN an HTML and a JSON report are persisted to disk', async () => {
                expect(existsSync(reportPaths.html)).toBe(true);
                expect(existsSync(reportPaths.json)).toBe(true);
            });
        },
    );
});
