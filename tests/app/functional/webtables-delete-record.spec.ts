// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { faker } from '@faker-js/faker';
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Web Tables', () => {
    test('should delete a record and remove it from the table', { tag: '@sanity' }, async ({ webTablesPage }) => {
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

        await test.step('GIVEN the Web Tables page, then add a new record via the Add modal so the test owns the row it deletes', async () => {
            await webTablesPage.goto();
            await webTablesPage.addRecord(record);
            await expect(webTablesPage.registrationModal).toBeHidden();
            await expect(webTablesPage.row(record.firstName)).toBeVisible();
        });

        await test.step('WHEN clicking the Delete control scoped to that row', async () => {
            const newRow = webTablesPage.row(record.firstName);
            await webTablesPage.deleteButtonIn(newRow).click();
        });

        await test.step('THEN the row is no longer present in the table', async () => {
            await expect(webTablesPage.row(record.firstName)).toBeHidden();
        });
    });
});
