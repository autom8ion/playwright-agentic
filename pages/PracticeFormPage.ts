import type { Locator, Page } from '@playwright/test';
import { Routes } from '../enums/endpoints';

export type PracticeFormData = {
    firstName: string;
    lastName: string;
    email: string;
    gender: 'Male' | 'Female' | 'Other';
    mobileNumber: string;
    subject: string;
    hobby: 'Sports' | 'Reading' | 'Music';
    address: string;
    state: string;
    city: string;
    picture: {
        name: string;
        mimeType: string;
        buffer: Buffer;
    };
};

export class PracticeFormPage {
    constructor(private readonly page: Page) {}

    // --- Interactive element locators ---
    get firstNameInput(): Locator {
        return this.page.getByRole('textbox', { name: 'First Name' });
    }

    get lastNameInput(): Locator {
        return this.page.getByRole('textbox', { name: 'Last Name' });
    }

    get emailInput(): Locator {
        return this.page.getByRole('textbox', { name: 'name@example.com' });
    }

    genderRadio(gender: string): Locator {
        return this.page.getByRole('radio', { name: gender, exact: true });
    }

    get mobileNumberInput(): Locator {
        return this.page.getByRole('textbox', { name: 'Mobile Number' });
    }

    // The subjects react-select input is a bare role="combobox" with no accessible
    // name, so its stable, page-specific #subjectsInput id is used instead of a
    // guessed ARIA name. Typing a value then pressing Enter adds it as a chip — it
    // does NOT strictly validate against a known subject list.
    get subjectsInput(): Locator {
        return this.page.locator('#subjectsInput');
    }

    hobbyCheckbox(hobby: string): Locator {
        return this.page.getByRole('checkbox', { name: hobby });
    }

    get pictureInput(): Locator {
        return this.page.getByRole('button', { name: 'Choose File' });
    }

    get addressInput(): Locator {
        return this.page.getByRole('textbox', { name: 'Current Address' });
    }

    // These react-selects also expose no accessible name on their inner input.
    // #state/#city are the stable container ids (unlike the inner
    // react-select-N-input ids, which are regenerated per page mount) — clicking
    // the container opens a listbox whose `option` entries DO have accessible names.
    get stateSelect(): Locator {
        return this.page.locator('#state');
    }

    get citySelect(): Locator {
        return this.page.locator('#city');
    }

    stateOption(state: string): Locator {
        return this.page.getByRole('option', { name: state });
    }

    cityOption(city: string): Locator {
        return this.page.getByRole('option', { name: city });
    }

    get submitButton(): Locator {
        return this.page.getByRole('button', { name: 'Submit' });
    }

    // --- Feedback / validation message locators ---
    // The modal has role="dialog" with aria-labelledby pointing at this title, so
    // its accessible name resolves directly — no CSS fallback needed here.
    get confirmationDialog(): Locator {
        return this.page.getByRole('dialog', { name: 'Thanks for submitting the form' });
    }

    confirmationRow(label: string): Locator {
        return this.confirmationDialog.getByRole('row').filter({ hasText: label });
    }

    // --- Action methods ---
    async goto(): Promise<void> {
        await this.page.goto(Routes.practiceForm);
    }

    async fillAndSubmit(data: PracticeFormData): Promise<void> {
        await this.firstNameInput.fill(data.firstName);
        await this.lastNameInput.fill(data.lastName);
        await this.emailInput.fill(data.email);
        await this.genderRadio(data.gender).click();
        await this.mobileNumberInput.fill(data.mobileNumber);
        await this.subjectsInput.fill(data.subject);
        await this.subjectsInput.press('Enter');
        await this.hobbyCheckbox(data.hobby).click();
        await this.pictureInput.setInputFiles(data.picture);
        await this.addressInput.fill(data.address);
        await this.stateSelect.click();
        await this.stateOption(data.state).click();
        await this.citySelect.click();
        await this.cityOption(data.city).click();
        await this.submitButton.click();
    }
}
