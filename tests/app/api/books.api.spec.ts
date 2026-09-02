import { expect, test } from '../../../fixtures/pom/test-options';
import { Endpoints } from '../../../enums/endpoints';
import { BooksListResponseSchema } from '../../../test-data/schemas/book-schema';
import { INVALID_ISBN_VALUES } from '../../../test-data/static/invalid-values';

test.describe('BookStore API', () => {
    test('should return the full catalog with a schema-valid body', { tag: '@api' }, async ({ apiRequest }) => {
        let status = 0;
        let body: unknown;

        await test.step('WHEN requesting the book list', async () => {
            ({ status, body } = await apiRequest({ method: 'GET', url: Endpoints.bookStore.books }));
        });

        await test.step('THEN the response is 200 with a schema-valid body', async () => {
            expect(status).toBe(200);
            expect(BooksListResponseSchema.parse(body)).toBeTruthy();
        });
    });

    for (const isbn of INVALID_ISBN_VALUES.filter(Boolean)) {
        test(`should 400 for an invalid isbn "${isbn}"`, { tag: '@api' }, async ({ apiRequest }) => {
            const { status } = await apiRequest({ method: 'GET', url: `${Endpoints.bookStore.book}?ISBN=${isbn}` });

            expect(status).toBe(400);
        });
    }
});
