import type { Locator, Page } from '@playwright/test';
import { Routes } from '../enums/endpoints';

export class ButtonsPage {
    constructor(private readonly page: Page) {}

    // --- Interactive element locators ---
    get doubleClickButton(): Locator {
        return this.page.getByRole('button', { name: 'Double Click Me' });
    }

    get rightClickButton(): Locator {
        return this.page.getByRole('button', { name: 'Right Click Me' });
    }

    // The third button's DOM id is a random string regenerated on every page load — match on
    // its exact accessible name instead so it doesn't also match "Double Click Me" / "Right
    // Click Me".
    get dynamicClickButton(): Locator {
        return this.page.getByRole('button', { name: 'Click Me', exact: true });
    }

    // --- Feedback / validation message locators ---
    get doubleClickMessage(): Locator {
        return this.page.getByText('You have done a double click');
    }

    get rightClickMessage(): Locator {
        return this.page.getByText('You have done a right click');
    }

    get dynamicClickMessage(): Locator {
        return this.page.getByText('You have done a dynamic click');
    }

    // --- Action methods ---
    async goto(): Promise<void> {
        await this.page.goto(Routes.buttons);
    }

    async doubleClick(): Promise<void> {
        await this.doubleClickButton.dblclick();
    }

    async rightClick(): Promise<void> {
        await this.rightClickButton.click({ button: 'right' });
    }

    async dynamicClick(): Promise<void> {
        await this.dynamicClickButton.click();
    }
}
