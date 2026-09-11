import { readFileSync } from 'node:fs';
import { test as base } from './api-request-fixture';
import { Endpoints } from '../../enums/endpoints';
import { CATALOG_BOOKS } from '../../test-data/static/catalog';
import { auditPage, type LighthouseReportPaths, type LighthouseThresholds } from '../../helpers/lighthouse';

export type ApiSession = {
    userId: string;
    token: string;
};

const API_SESSION_PATH = '.auth/app/apiSession.json';

export type HelperFixtures = {
    /** The authenticated demoqa user/token pair written by `auth.setup.ts`. */
    apiSession: ApiSession;
    /** Adds a catalog book to the session user's collection via the API before the test, and removes it after — API-driven setup/teardown so UI tests start from a known state. */
    createdBook: typeof CATALOG_BOOKS.gitPocketGuide;
    /** Clears the pre-authenticated storage state's cookies for tests that must start logged out (e.g. login-flow specs). */
    resetStorageState: () => Promise<void>;
    /** Runs a Lighthouse audit against the page's current URL; see helpers/lighthouse.ts. */
    lighthouseAudit: (label: string, thresholds?: Partial<LighthouseThresholds>) => Promise<LighthouseReportPaths>;
};

export const test = base.extend<HelperFixtures>({
    apiSession: async ({}, use) => {
        const raw = readFileSync(API_SESSION_PATH, 'utf-8');
        await use(JSON.parse(raw) as ApiSession);
    },

    resetStorageState: async ({ context }, use) => {
        await use(async () => {
            await context.clearCookies();
        });
    },

    lighthouseAudit: async ({ page }, use) => {
        await use((label, thresholds) => auditPage(page, label, thresholds));
    },

    createdBook: async ({ apiRequest, apiSession }, use) => {
        const book = CATALOG_BOOKS.gitPocketGuide;

        await apiRequest({
            method: 'POST',
            url: Endpoints.bookStore.books,
            token: apiSession.token,
            data: { userId: apiSession.userId, collectionOfIsbns: [{ isbn: book.isbn }] },
        });

        await use(book);

        await apiRequest({
            method: 'DELETE',
            url: Endpoints.bookStore.book,
            token: apiSession.token,
            data: { isbn: book.isbn, userId: apiSession.userId },
        });
    },
});
