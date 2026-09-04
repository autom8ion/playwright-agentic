// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';
import { generatePracticeFormData } from '../../../test-data/factories/practice-form-factory';

test.describe('Practice Form', () => {
    test(
        'should submit successfully with only the mandatory fields populated',
        { tag: '@regression' },
        async ({ practiceFormPage }) => {
            const data = generatePracticeFormData();

            await test.step('GIVEN the practice form page, with only First Name, Last Name, Gender, and Mobile Number filled from generated data', async () => {
                await practiceFormPage.goto();
                await practiceFormPage.firstNameInput.fill(data.firstName);
                await practiceFormPage.lastNameInput.fill(data.lastName);
                await practiceFormPage.genderRadio(data.gender).click();
                await practiceFormPage.mobileNumberInput.fill(data.mobileNumber);

                await expect(practiceFormPage.firstNameInput).not.toHaveCSS('border-color', 'rgb(220, 53, 69)');
                await expect(practiceFormPage.lastNameInput).not.toHaveCSS('border-color', 'rgb(220, 53, 69)');
                await expect(practiceFormPage.mobileNumberInput).not.toHaveCSS('border-color', 'rgb(220, 53, 69)');
            });

            await test.step('WHEN clicking Submit', async () => {
                await practiceFormPage.submitButton.click();
                await expect(practiceFormPage.confirmationDialog).toBeVisible();
            });

            await test.step("THEN the confirmation modal's Student Name, Gender, and Mobile rows match the entered values, and the Student Email/Subjects/Hobbies/Address/State and City rows are empty", async () => {
                await expect(practiceFormPage.confirmationRow('Student Name')).toContainText(
                    `${data.firstName} ${data.lastName}`,
                );
                await expect(practiceFormPage.confirmationRow('Gender')).toContainText(data.gender);
                await expect(practiceFormPage.confirmationRow('Mobile')).toContainText(data.mobileNumber);

                await expect(practiceFormPage.confirmationRow('Student Email')).toHaveText('Student Email');
                await expect(practiceFormPage.confirmationRow('Subjects')).toHaveText('Subjects');
                await expect(practiceFormPage.confirmationRow('Hobbies')).toHaveText('Hobbies');
                await expect(practiceFormPage.confirmationRow('Address')).toHaveText('Address');
                await expect(practiceFormPage.confirmationRow('State and City')).toHaveText('State and City');
            });
        },
    );
});
