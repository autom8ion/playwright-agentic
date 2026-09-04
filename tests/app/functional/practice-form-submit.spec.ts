// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';
import { generatePracticeFormData } from '../../../test-data/factories/practice-form-factory';

test.describe('Practice Form', () => {
    test(
        'should submit the practice form with generated data and see every field echoed in the confirmation modal',
        { tag: '@sanity' },
        async ({ practiceFormPage }) => {
            const data = generatePracticeFormData();

            await test.step('GIVEN a new PracticeFormPage page object navigates to the practice form with generated field data', async () => {
                await practiceFormPage.goto();
                await expect(practiceFormPage.firstNameInput).toBeEmpty();
                await expect(practiceFormPage.lastNameInput).toBeEmpty();
                await expect(practiceFormPage.emailInput).toBeEmpty();
                await expect(practiceFormPage.addressInput).toBeEmpty();
            });

            await test.step('WHEN filling every field with the generated data and clicking Submit', async () => {
                await practiceFormPage.fillAndSubmit(data);
                await expect(practiceFormPage.confirmationDialog).toBeVisible();
            });

            await test.step('THEN each row of the confirmation table matches the generated data', async () => {
                await expect(practiceFormPage.confirmationRow('Student Name')).toContainText(
                    `${data.firstName} ${data.lastName}`,
                );
                await expect(practiceFormPage.confirmationRow('Student Email')).toContainText(data.email);
                await expect(practiceFormPage.confirmationRow('Gender')).toContainText(data.gender);
                await expect(practiceFormPage.confirmationRow('Mobile')).toContainText(data.mobileNumber);
                await expect(practiceFormPage.confirmationRow('Subjects')).toContainText(data.subject);
                await expect(practiceFormPage.confirmationRow('Hobbies')).toContainText(data.hobby);
                await expect(practiceFormPage.confirmationRow('Address')).toContainText(data.address);
                await expect(practiceFormPage.confirmationRow('State and City')).toContainText(
                    `${data.state} ${data.city}`,
                );
            });
        },
    );
});
