// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Accordion', () => {
    test(
        'should collapse the previously-open section when a different section is expanded',
        { tag: '@regression' },
        async ({ accordionPage }) => {
            await test.step("GIVEN the Accordion page with 'What is Lorem Ipsum?' expanded by default", async () => {
                await accordionPage.goto();
                await expect(accordionPage.sectionHeader('What is Lorem Ipsum?')).toHaveAttribute(
                    'aria-expanded',
                    'true',
                );
                await expect(accordionPage.sectionContent('What is Lorem Ipsum?')).toBeVisible();
            });

            await test.step("WHEN clicking the 'Where does it come from?' section header", async () => {
                await accordionPage.expandSection('Where does it come from?');
            });

            await test.step('THEN that section expands and its two paragraphs become visible', async () => {
                await expect(accordionPage.sectionHeader('Where does it come from?')).toHaveAttribute(
                    'aria-expanded',
                    'true',
                );
                await expect(accordionPage.sectionContent('Where does it come from?')).toBeVisible();
                await expect(accordionPage.sectionContent('Where does it come from?')).toContainText(
                    'Contrary to popular belief, Lorem Ipsum is not simply random text.',
                );
                await expect(accordionPage.sectionContent('Where does it come from?')).toContainText(
                    'The standard chunk of Lorem Ipsum used since the 1500s is reproduced below',
                );
            });

            await test.step("AND the previously-open 'What is Lorem Ipsum?' section is collapsed, confirming only one section is open at a time", async () => {
                await expect(accordionPage.sectionHeader('What is Lorem Ipsum?')).toHaveAttribute(
                    'aria-expanded',
                    'false',
                );
                await expect(accordionPage.sectionContent('What is Lorem Ipsum?')).toBeHidden();
            });
        },
    );
});
