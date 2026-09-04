// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { faker } from '@faker-js/faker';
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Web Tables', () => {
    test(
        'should add a new record via the Add modal and see it in the table',
        { tag: '@sanity' },
        async ({ webTablesPage }) => {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const record = {
                firstName,
                lastName,
                email: faker.internet.email({ firstName, lastName }),
                age: faker.number.int({ min: 18, max: 60 }).toString(),
                salary: faker.number.int({ min: 20000, max: 150000 }).toString(),
                department: faker.commerce.department(),
            };

            await test.step('GIVEN a new WebTablesPage page object navigates directly to /webtables', async () => {
                await webTablesPage.goto();
                await expect(webTablesPage.row('Cierra')).toBeVisible();
                await expect(webTablesPage.row('Alden')).toBeVisible();
                await expect(webTablesPage.row('Kierra')).toBeVisible();
                await expect(webTablesPage.addButton).toBeVisible();
            });

            await test.step('WHEN adding a new record via the Add modal with generated data', async () => {
                await webTablesPage.addRecord(record);
                await expect(webTablesPage.registrationModal).toBeHidden();
            });

            await test.step('THEN the new row is visible with all the entered values in the correct columns', async () => {
                const newRow = webTablesPage.row(record.firstName);
                await expect(newRow).toBeVisible();
                await expect(newRow).toContainText(record.lastName);
                await expect(newRow).toContainText(record.age);
                await expect(newRow).toContainText(record.email);
                await expect(newRow).toContainText(record.salary);
                await expect(newRow).toContainText(record.department);
            });
        },
    );
});
