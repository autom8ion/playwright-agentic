import { expect, test } from '../../../fixtures/pom/test-options';
import { Endpoints } from '../../../enums/endpoints';
import { UserWithBooksResponseSchema } from '../../../test-data/schemas/account-schema';

// demoqa's bulk DELETE /BookStore/v1/Books endpoint returns a hard 401
// ("User Id not correct!") for every request regardless of a valid
// token/userId — a confirmed bug in the demo app, not in this test. Wiping
// the collection by fetching the user's current books and deleting each one
// individually is the reliable path, and it's still a shared-state mutation
// (not just the book this test's own fixture added) — hence @destructive.
test(
    "should wipe every book from the user's collection",
    { tag: '@destructive' },
    async ({ apiRequest, apiSession, createdBook }) => {
        await test.step('GIVEN at least one book in the collection', async () => {
            expect(createdBook.isbn).toBeTruthy();
        });

        await test.step('WHEN deleting every book currently in the collection', async () => {
            const { status, body } = await apiRequest({
                method: 'GET',
                url: Endpoints.account.user(apiSession.userId),
                token: apiSession.token,
            });
            expect(status).toBe(200);
            const user = UserWithBooksResponseSchema.parse(body);

            for (const book of user.books) {
                const deleteResponse = await apiRequest({
                    method: 'DELETE',
                    url: Endpoints.bookStore.book,
                    token: apiSession.token,
                    data: { isbn: book.isbn, userId: apiSession.userId },
                });
                expect(deleteResponse.status).toBe(204);
            }
        });

        await test.step('THEN the collection is empty', async () => {
            const { body } = await apiRequest({
                method: 'GET',
                url: Endpoints.account.user(apiSession.userId),
                token: apiSession.token,
            });
            expect(UserWithBooksResponseSchema.parse(body).books).toEqual([]);
        });
    },
);
