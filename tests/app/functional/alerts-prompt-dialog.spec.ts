// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { faker } from '@faker-js/faker';
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Alerts', () => {
    test(
        'should echo back the typed text after accepting the prompt dialog',
        { tag: '@sanity' },
        async ({ alertsPage }) => {
            const enteredName = faker.person.fullName();

            await test.step("GIVEN the Alerts page, on the 'prompt box will appear' section", async () => {
                await alertsPage.goto();
                await expect(alertsPage.promptButton).toBeVisible();
            });

            await test.step('WHEN clicking the button and accepting the resulting prompt dialog with a generated name value', async () => {
                await alertsPage.triggerPrompt(enteredName);
            });

            await test.step('THEN an on-page result element reads "You entered <the typed name>"', async () => {
                await expect(alertsPage.promptResultText).toHaveText(`You entered ${enteredName}`);
            });
        },
    );
});
