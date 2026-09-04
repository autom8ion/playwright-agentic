// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Practice Form', () => {
    test(
        'should not open the confirmation modal and should flag required fields when submitting an empty form',
        { tag: '@regression' },
        async ({ practiceFormPage }) => {
            await test.step('GIVEN a fresh, completely empty practice form', async () => {
                await practiceFormPage.goto();

                await expect(practiceFormPage.firstNameInput).not.toHaveCSS('border-color', 'rgb(220, 53, 69)');
                await expect(practiceFormPage.lastNameInput).not.toHaveCSS('border-color', 'rgb(220, 53, 69)');
                await expect(practiceFormPage.mobileNumberInput).not.toHaveCSS('border-color', 'rgb(220, 53, 69)');
            });

            await test.step('WHEN clicking Submit without filling anything', async () => {
                await practiceFormPage.submitButton.click();

                await expect(practiceFormPage.confirmationDialog).toBeHidden();
            });

            await test.step('THEN the required fields (First Name, Last Name, Mobile Number) are visibly flagged invalid', async () => {
                await expect(practiceFormPage.firstNameInput).toHaveCSS('border-color', 'rgb(220, 53, 69)');
                await expect(practiceFormPage.lastNameInput).toHaveCSS('border-color', 'rgb(220, 53, 69)');
                await expect(practiceFormPage.mobileNumberInput).toHaveCSS('border-color', 'rgb(220, 53, 69)');
            });
        },
    );
});
