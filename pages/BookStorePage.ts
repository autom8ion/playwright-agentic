import type { Locator, Page } from '@playwright/test';
import { Routes } from '../enums/endpoints';

export class BookStorePage {
    constructor(private readonly page: Page) {}

    // --- Interactive element locators ---
    get searchBox(): Locator {
        return this.page.getByPlaceholder('Type to search');
    }

    get loginLink(): Locator {
        return this.page.getByRole('link', { name: 'Login', exact: true });
    }

    get addToCollectionButton(): Locator {
        return this.page.getByRole('button', { name: 'Add To Your Collection' });
    }

    bookRow(title: string): Locator {
        return this.page.getByRole('link', { name: title, exact: true });
    }

    // --- Feedback / validation message locators ---
    get alreadyAddedMessage(): Locator {
        return this.page.getByText('Already added');
    }

    // --- Action methods ---
    async goto(): Promise<void> {
        await this.page.goto(Routes.books);
    }

    async openBook(title: string): Promise<void> {
        await this.bookRow(title).click();
    }

    async searchFor(query: string): Promise<void> {
        await this.searchBox.fill(query);
    }

    async addCurrentBookToCollection(): Promise<void> {
        // A successful add fires a native `alert()` *after* the POST resolves —
        // waiting for it (instead of just clicking) is what makes this action
        // actually finish before the caller moves on, no hard wait needed.
        await Promise.all([
            this.page.waitForEvent('dialog').then((dialog) => dialog.accept()),
            this.addToCollectionButton.click(),
        ]);
    }
}
