// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { faker } from '@faker-js/faker';
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Web Tables', () => {
    test('should match an aria snapshot of a newly added row', { tag: '@sanity' }, async ({ webTablesPage }) => {
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
            await expect(webTablesPage.addButton).toBeVisible();
        });

        await test.step('WHEN adding a new record via the Add modal with generated data', async () => {
            await webTablesPage.addRecord(record);
            await expect(webTablesPage.registrationModal).toBeHidden();
        });

        await test.step('THEN one aria snapshot verifies every data cell lands in the right column, in order', async () => {
            // Trailing siblings that aren't listed are unconstrained too, so the row's 7th
            // (Action) cell can be left out entirely — its Edit/Delete icons expose an
            // unstable accessible role (see app-notes: Web Tables) and add nothing this
            // scenario needs to check.
            await expect(webTablesPage.row(record.firstName)).toMatchAriaSnapshot(`
                    - cell "${record.firstName}"
                    - cell "${record.lastName}"
                    - cell "${record.age}"
                    - cell "${record.email}"
                    - cell "${record.salary}"
                    - cell "${record.department}"
                `);
        });
    });
});
