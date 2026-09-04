import type { Locator, Page } from '@playwright/test';
import { Routes } from '../enums/endpoints';

export class AccordionPage {
    constructor(private readonly page: Page) {}

    // --- Interactive element locators ---
    sectionHeader(name: string): Locator {
        return this.page.getByRole('button', { name });
    }

    // --- Feedback / validation message locators ---
    // Each section's body text lives in a `.accordion-body` div beneath its header, inside a
    // shared `.accordion-item` wrapper. Neither wrapper nor body div carries an accessible
    // role/name of its own (only the header button does), so scoping by the section's own header
    // via `.filter({ has })` is the least-CSS-reliant way to disambiguate three otherwise-identical
    // `.accordion-item` containers; `.accordion-body` is a CSS last resort for the content node
    // itself, the same way AlertsPage falls back to ids.
    sectionContent(name: string): Locator {
        return this.page
            .locator('.accordion-item')
            .filter({ has: this.sectionHeader(name) })
            .locator('.accordion-body');
    }

    // --- Action methods ---
    async goto(): Promise<void> {
        await this.page.goto(Routes.accordion);
    }

    // Single-open accordion: clicking one section's header expands it and collapses whichever
    // was previously open.
    async expandSection(name: string): Promise<void> {
        await this.sectionHeader(name).click();
    }
}
