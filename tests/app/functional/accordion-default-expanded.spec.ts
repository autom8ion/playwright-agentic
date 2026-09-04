// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Accordion', () => {
    test(
        "should show only the default-expanded section's content on page load",
        { tag: '@sanity' },
        async ({ accordionPage }) => {
            await test.step('GIVEN a new AccordionPage page object navigates to https://demoqa.com/accordian', async () => {
                await accordionPage.goto();
                await expect(accordionPage.sectionHeader('What is Lorem Ipsum?')).toBeVisible();
                await expect(accordionPage.sectionHeader('What is Lorem Ipsum?')).toHaveAttribute(
                    'aria-expanded',
                    'true',
                );
            });

            await test.step("THEN only that section's paragraph content is visible", async () => {
                await expect(accordionPage.sectionContent('What is Lorem Ipsum?')).toBeVisible();
                await expect(accordionPage.sectionContent('What is Lorem Ipsum?')).toContainText(
                    'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
                );

                await expect(accordionPage.sectionHeader('Where does it come from?')).toHaveAttribute(
                    'aria-expanded',
                    'false',
                );
                await expect(accordionPage.sectionContent('Where does it come from?')).toBeHidden();

                await expect(accordionPage.sectionHeader('Why do we use it?')).toHaveAttribute(
                    'aria-expanded',
                    'false',
                );
                await expect(accordionPage.sectionContent('Why do we use it?')).toBeHidden();
            });
        },
    );
});
