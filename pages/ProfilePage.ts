import type { Locator, Page } from '@playwright/test';
import { Messages } from '../enums/messages';
import { Routes } from '../enums/endpoints';

export class ProfilePage {
    constructor(private readonly page: Page) {}

    // --- Interactive element locators ---
    get logoutButton(): Locator {
        return this.page.getByRole('button', { name: 'Logout' });
    }

    // No role/label/placeholder/text/testid exposes this element — CSS id is the documented last resort.
    get userNameHeading(): Locator {
        return this.page.locator('#userName-value');
    }

    // The delete control is a bare <span title="Delete"> (no accessible role), keyed by ISBN — CSS id last resort.
    deleteButton(isbn: string): Locator {
        return this.page.locator(`#delete-record-${isbn}`);
    }

    get confirmDeleteButton(): Locator {
        return this.page.getByRole('button', { name: 'OK', exact: true });
    }

    // --- Feedback / validation message locators ---
    get noBooksMessage(): Locator {
        return this.page.getByText(Messages.bookStore.noBooksAvailable);
    }

    // --- Action methods ---
    async goto(): Promise<void> {
        await this.page.goto(Routes.profile);
    }

    bookRow(title: string): Locator {
        return this.page.getByRole('row').filter({ hasText: title });
    }

    async deleteBook(isbn: string): Promise<void> {
        await this.deleteButton(isbn).click();
        await this.confirmDeleteButton.click();
    }

    async logout(): Promise<void> {
        await this.logoutButton.click();
    }
}
