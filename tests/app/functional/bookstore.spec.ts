import { expect, test } from '../../../fixtures/pom/test-options';
import { CATALOG_BOOKS } from '../../../test-data/static/catalog';

test('should find a known book via search', { tag: '@smoke' }, async ({ bookStorePage }) => {
    await test.step('GIVEN the book store page', async () => {
        await bookStorePage.goto();
    });

    await test.step('WHEN searching for a known title', async () => {
        await bookStorePage.searchFor(CATALOG_BOOKS.gitPocketGuide.title);
    });

    await test.step('THEN the matching book row is visible', async () => {
        await expect(bookStorePage.bookRow(CATALOG_BOOKS.gitPocketGuide.title)).toBeVisible();
    });
});
