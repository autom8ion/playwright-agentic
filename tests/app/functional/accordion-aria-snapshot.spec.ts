// spec: specs/expanded-coverage.plan.md
// seed: tests/app/seed.spec.ts
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Accordion', () => {
    test(
        "should match an aria snapshot of the whole widget's structure and expand state",
        { tag: '@sanity' },
        async ({ accordionPage }) => {
            await test.step("GIVEN the Accordion page with 'What is Lorem Ipsum?' expanded by default", async () => {
                await accordionPage.goto();
                await expect(accordionPage.sectionHeader('What is Lorem Ipsum?')).toBeVisible();

                // A node with no [expanded] annotation is unconstrained (not asserted false) — the
                // two collapsed sections need the explicit `[expanded=false]` to actually be checked;
                // omitting it here would silently pass even if they were expanded too. Descendants
                // that aren't listed (the expanded section's paragraph body) are also unconstrained,
                // so the long Lorem Ipsum text doesn't need to be reproduced for this one call to be
                // exact about the part that matters: which section is open.
                await expect(accordionPage.container).toMatchAriaSnapshot(`
                    - heading "What is Lorem Ipsum?" [level=2]:
                      - button "What is Lorem Ipsum?" [expanded]
                    - heading "Where does it come from?" [level=2]:
                      - button "Where does it come from?" [expanded=false]
                    - heading "Why do we use it?" [level=2]:
                      - button "Why do we use it?" [expanded=false]
                `);
            });

            await test.step("WHEN clicking the 'Where does it come from?' section header", async () => {
                await accordionPage.expandSection('Where does it come from?');
            });

            await test.step('THEN one aria snapshot confirms the open section flipped and the other two collapsed, in a single call', async () => {
                await expect(accordionPage.container).toMatchAriaSnapshot(`
                    - heading "What is Lorem Ipsum?" [level=2]:
                      - button "What is Lorem Ipsum?" [expanded=false]
                    - heading "Where does it come from?" [level=2]:
                      - button "Where does it come from?" [expanded]
                    - heading "Why do we use it?" [level=2]:
                      - button "Why do we use it?" [expanded=false]
                `);
            });
        },
    );
});
