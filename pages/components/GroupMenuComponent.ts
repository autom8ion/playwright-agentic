import type { Locator, Page } from '@playwright/test';

// The left-nav accordion (category list: Elements, Forms, Alerts Frame & Windows, Widgets,
// Interactions, Book Store Application) is present on every non-home page. Its wrapper
// (`.left-pannel` — typo is real, matches the /accordian route typo) carries no accessible
// role of its own, only its category text and the real <a> links beneath it do.
export class GroupMenuComponent {
    constructor(private readonly page: Page) {}

    // --- Interactive element locators ---
    get container(): Locator {
        return this.page.locator('.left-pannel');
    }

    category(name: string): Locator {
        return this.container.getByText(name, { exact: true });
    }

    link(name: string): Locator {
        return this.container.getByRole('link', { name });
    }

    // --- Action methods ---
    // Single-open accordion, like the Accordion widget: expand the category only if its link
    // isn't already visible (another category may currently be open), then follow the link.
    async navigateTo(category: string, linkName: string): Promise<void> {
        if (!(await this.link(linkName).isVisible())) {
            await this.category(category).click();
        }
        await this.link(linkName).click();
    }
}
