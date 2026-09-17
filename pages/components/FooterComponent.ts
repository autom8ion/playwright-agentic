import type { Locator, Page } from '@playwright/test';

export class FooterComponent {
    constructor(private readonly page: Page) {}

    // --- Feedback / validation message locators ---
    get copyright(): Locator {
        return this.page.getByRole('contentinfo');
    }
}
