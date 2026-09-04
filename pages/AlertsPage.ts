import type { Locator, Page } from '@playwright/test';
import { Routes } from '../enums/endpoints';

export class AlertsPage {
    constructor(private readonly page: Page) {}

    // --- Interactive element locators ---
    // All four sections share the identical accessible name "Click me" with no distinguishing
    // container role (confirmed live: a `.row`-based text filter matches an ancestor wrapping all
    // four sections, not just one) — CSS id is the documented last resort here, the same as
    // ProfilePage.deleteButton.
    get alertButton(): Locator {
        return this.page.locator('#alertButton');
    }

    get timerAlertButton(): Locator {
        return this.page.locator('#timerAlertButton');
    }

    get confirmButton(): Locator {
        return this.page.locator('#confirmButton');
    }

    get promptButton(): Locator {
        return this.page.locator('#promtButton');
    }

    get alertSectionLabel(): Locator {
        return this.page.getByText('Click Button to see alert');
    }

    // Doesn't exist in the DOM until the confirm dialog has been handled at least once —
    // confirmed live (absent on a fresh page load).
    get confirmResultText(): Locator {
        return this.page.locator('#confirmResult');
    }

    // Same as confirmResultText: absent until the prompt dialog has been handled at least once.
    get promptResultText(): Locator {
        return this.page.locator('#promptResult');
    }

    // --- Action methods ---
    async goto(): Promise<void> {
        await this.page.goto(Routes.alerts);
    }

    // Races the click against the dialog event the same way
    // BookStorePage.addCurrentBookToCollection does, and for the same reason: the native dialog
    // blocks the page's JS execution the instant it opens, so `click()` itself won't resolve until
    // the dialog is dismissed — accepting it must happen inside the `.then()`, concurrently with
    // the click, not after both promises settle (awaiting `Promise.all` first would deadlock).
    async triggerAlert(): Promise<string> {
        let message = '';
        await Promise.all([
            this.page.waitForEvent('dialog').then((dialog) => {
                message = dialog.message();
                return dialog.accept();
            }),
            this.alertButton.click(),
        ]);
        return message;
    }

    async triggerTimerAlert(): Promise<string> {
        let message = '';
        await Promise.all([
            this.page.waitForEvent('dialog', { timeout: 10_000 }).then((dialog) => {
                message = dialog.message();
                return dialog.accept();
            }),
            this.timerAlertButton.click(),
        ]);
        return message;
    }

    async triggerConfirm(action: 'accept' | 'dismiss'): Promise<void> {
        await Promise.all([
            this.page
                .waitForEvent('dialog')
                .then((dialog) => (action === 'accept' ? dialog.accept() : dialog.dismiss())),
            this.confirmButton.click(),
        ]);
    }

    async triggerPrompt(text: string): Promise<void> {
        await Promise.all([
            this.page.waitForEvent('dialog').then((dialog) => dialog.accept(text)),
            this.promptButton.click(),
        ]);
    }
}
