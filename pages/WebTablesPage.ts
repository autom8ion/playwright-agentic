import type { Locator, Page } from '@playwright/test';
import { Routes } from '../enums/endpoints';

export type WebTableRecord = {
    firstName: string;
    lastName: string;
    email: string;
    age: string;
    salary: string;
    department: string;
};

export class WebTablesPage {
    constructor(private readonly page: Page) {}

    // --- Interactive element locators ---
    get addButton(): Locator {
        return this.page.getByRole('button', { name: 'Add' });
    }

    get searchBox(): Locator {
        return this.page.getByPlaceholder('Type to search');
    }

    get firstNameInput(): Locator {
        return this.page.getByRole('textbox', { name: 'First Name' });
    }

    get lastNameInput(): Locator {
        return this.page.getByRole('textbox', { name: 'Last Name' });
    }

    get emailInput(): Locator {
        return this.page.getByRole('textbox', { name: 'name@example.com' });
    }

    get ageInput(): Locator {
        return this.page.getByRole('textbox', { name: 'Age' });
    }

    get salaryInput(): Locator {
        return this.page.getByRole('textbox', { name: 'Salary' });
    }

    get departmentInput(): Locator {
        return this.page.getByRole('textbox', { name: 'Department' });
    }

    get submitButton(): Locator {
        return this.page.getByRole('button', { name: 'Submit' });
    }

    // No accessible name on this dialog (no aria-label/aria-labelledby) — it's the only
    // [role="dialog"] on the page, so an unscoped getByRole('dialog') is unambiguous.
    get registrationModal(): Locator {
        return this.page.getByRole('dialog');
    }

    row(value: string): Locator {
        return this.page.getByRole('row').filter({ hasText: value });
    }

    // The Edit/Delete controls are bare <span title="Edit"|"Delete"> with no interactive ARIA
    // role, so getByRole('button', ...) can't find them — getByTitle scoped to the row is the
    // accessible-name-based fit here.
    editButtonIn(row: Locator): Locator {
        return row.getByTitle('Edit');
    }

    deleteButtonIn(row: Locator): Locator {
        return row.getByTitle('Delete');
    }

    // --- Action methods ---
    async goto(): Promise<void> {
        await this.page.goto(Routes.webTables);
    }

    async addRecord(record: WebTableRecord): Promise<void> {
        await this.addButton.click();
        await this.firstNameInput.fill(record.firstName);
        await this.lastNameInput.fill(record.lastName);
        await this.emailInput.fill(record.email);
        await this.ageInput.fill(record.age);
        await this.salaryInput.fill(record.salary);
        await this.departmentInput.fill(record.department);
        await this.submitButton.click();
    }

    async searchFor(query: string): Promise<void> {
        await this.searchBox.fill(query);
    }
}
