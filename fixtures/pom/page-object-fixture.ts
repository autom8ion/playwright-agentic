import { test as base } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { BookStorePage } from '../../pages/BookStorePage';
import { ProfilePage } from '../../pages/ProfilePage';
import { WebTablesPage } from '../../pages/WebTablesPage';
import { PracticeFormPage } from '../../pages/PracticeFormPage';
import { AlertsPage } from '../../pages/AlertsPage';
import { AccordionPage } from '../../pages/AccordionPage';

export type PageObjectFixtures = {
    loginPage: LoginPage;
    bookStorePage: BookStorePage;
    profilePage: ProfilePage;
    webTablesPage: WebTablesPage;
    practiceFormPage: PracticeFormPage;
    alertsPage: AlertsPage;
    accordionPage: AccordionPage;
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
    webTablesPage: async ({ page }, use) => {
        await use(new WebTablesPage(page));
    },
    practiceFormPage: async ({ page }, use) => {
        await use(new PracticeFormPage(page));
    },
    alertsPage: async ({ page }, use) => {
        await use(new AlertsPage(page));
    },
    accordionPage: async ({ page }, use) => {
        await use(new AccordionPage(page));
    },
});
