import type { Locator, Page } from '@playwright/test';

// The <header> banner has one link (logo → demoqa.com) with no accessible name of its
// own (bare <a><img></a>, no alt text) — `getByRole('banner')` scopes it uniquely.
export class HeaderComponent {
    constructor(private readonly page: Page) {}

    // --- Interactive element locators ---
    get logoLink(): Locator {
        return this.page.getByRole('banner').getByRole('link');
    }

    // --- Action methods ---
    async goHome(): Promise<void> {
        await this.logoLink.click();
    }
}
