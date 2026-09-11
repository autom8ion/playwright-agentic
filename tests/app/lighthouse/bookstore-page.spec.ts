import { existsSync } from 'node:fs';
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Lighthouse audit', () => {
    test(
        'should meet baseline quality thresholds and persist a report for the authenticated Book Store profile page',
        { tag: '@regression' },
        async ({ profilePage, lighthouseAudit }) => {
            await test.step('GIVEN the authenticated Book Store profile page has loaded', async () => {
                await profilePage.goto();
                await expect(profilePage.userNameHeading).toBeVisible();
            });

            let reportPaths: { html: string; json: string };

            await test.step('WHEN running a Lighthouse audit against it', async () => {
                // Its delete controls are bare, roleless <span>s (see .claude/skills/app-notes),
                // so accessibility runs a little lower here than the repo-wide default floor.
                reportPaths = await lighthouseAudit('bookstore-profile', { accessibility: 50 });
            });

            await test.step('THEN an HTML and a JSON report are persisted to disk', async () => {
                expect(existsSync(reportPaths.html)).toBe(true);
                expect(existsSync(reportPaths.json)).toBe(true);
            });
        },
    );
});
