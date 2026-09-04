// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Web Tables', () => {
    test(
        'should filter rows to only matches when searching, and restore all rows when the search is cleared',
        { tag: '@regression' },
        async ({ webTablesPage }) => {
            await test.step('GIVEN the Web Tables page with its 3 seeded rows all visible', async () => {
                await webTablesPage.goto();
                await expect(webTablesPage.row('Cierra')).toBeVisible();
                await expect(webTablesPage.row('Alden')).toBeVisible();
                await expect(webTablesPage.row('Kierra')).toBeVisible();
            });

            await test.step("WHEN typing a value that matches only one seeded row ('Cierra') into the search box", async () => {
                await webTablesPage.searchFor('Cierra');
                await expect(webTablesPage.row('Cierra')).toBeVisible();
                await expect(webTablesPage.row('Alden')).toBeHidden();
                await expect(webTablesPage.row('Kierra')).toBeHidden();
            });

            await test.step('AND clearing the search box', async () => {
                await webTablesPage.searchFor('');
                await expect(webTablesPage.row('Cierra')).toBeVisible();
                await expect(webTablesPage.row('Alden')).toBeVisible();
                await expect(webTablesPage.row('Kierra')).toBeVisible();
            });
        },
    );
});
