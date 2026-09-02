import { test as base } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { BookStorePage } from '../../pages/BookStorePage';
import { ProfilePage } from '../../pages/ProfilePage';

export type PageObjectFixtures = {
    loginPage: LoginPage;
    bookStorePage: BookStorePage;
    profilePage: ProfilePage;
};

export const test = base.extend<PageObjectFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    bookStorePage: async ({ page }, use) => {
        await use(new BookStorePage(page));
    },
    profilePage: async ({ page }, use) => {
        await use(new ProfilePage(page));
    },
});
