import { expect, test } from '../../../fixtures/pom/test-options';
import { CATALOG_BOOKS } from '../../../test-data/static/catalog';

test(
    'should add a book to the collection and see it on the profile page',
    { tag: '@e2e' },
    async ({ bookStorePage, profilePage }) => {
        const book = CATALOG_BOOKS.learningJavaScriptDesignPatterns;

        await test.step('GIVEN a book in the store', async () => {
            await bookStorePage.goto();
            await bookStorePage.openBook(book.title);
        });

        await test.step('WHEN adding it to the collection', async () => {
            await bookStorePage.addCurrentBookToCollection();
        });

        await test.step('THEN it appears on the profile page', async () => {
            await profilePage.goto();
            await expect(profilePage.bookRow(book.title)).toBeVisible();
        });

        await test.step('AND cleanup: remove it so the test owns only its own data', async () => {
            await profilePage.deleteBook(book.isbn);
            await expect(profilePage.bookRow(book.title)).toBeHidden();
        });
    },
);
