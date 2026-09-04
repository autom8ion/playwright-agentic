// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Web Tables', () => {
    test(
        'should edit an existing record and see the updated values in place',
        { tag: '@sanity' },
        async ({ webTablesPage }) => {
            const updatedAge = '50';
            const updatedSalary = '75000';

            await test.step('GIVEN the Web Tables page with its 3 seeded rows', async () => {
                await webTablesPage.goto();
                const aldenRow = webTablesPage.row('Alden');
                await expect(aldenRow).toBeVisible();
                await expect(aldenRow).toContainText('Cantrell');
            });

            await test.step('WHEN clicking the Edit control scoped to that row, changing the Age and Salary fields in the modal, and clicking Submit', async () => {
                const aldenRow = webTablesPage.row('Alden');
                await webTablesPage.editButtonIn(aldenRow).click();
                await webTablesPage.ageInput.fill(updatedAge);
                await webTablesPage.salaryInput.fill(updatedSalary);
                await webTablesPage.submitButton.click();
                await expect(webTablesPage.registrationModal).toBeHidden();
            });

            await test.step('THEN the same row (still identifiable by its unchanged first/last name) shows the updated Age and Salary values', async () => {
                const aldenRow = webTablesPage.row('Alden');
                await expect(aldenRow).toContainText('Cantrell');
                await expect(aldenRow).toContainText(updatedAge);
                await expect(aldenRow).toContainText(updatedSalary);
            });
        },
    );
});
