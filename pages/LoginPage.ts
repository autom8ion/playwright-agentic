import type { Locator, Page } from '@playwright/test';
import { Messages } from '../enums/messages';
import { Routes } from '../enums/endpoints';

export class LoginPage {
    constructor(private readonly page: Page) {}

    // --- Interactive element locators ---
    get userNameInput(): Locator {
        return this.page.getByPlaceholder('UserName');
    }

    get passwordInput(): Locator {
        return this.page.getByPlaceholder('Password');
    }

    get loginButton(): Locator {
        return this.page.getByRole('button', { name: 'Login', exact: true });
    }

    get newUserButton(): Locator {
        return this.page.getByRole('button', { name: 'New User' });
    }

    // --- Feedback / validation message locators ---
    get invalidCredentialsMessage(): Locator {
        return this.page.getByText(Messages.auth.invalidCredentials);
    }

    // --- Action methods ---
    async goto(): Promise<void> {
        await this.page.goto(Routes.login);
    }

    async login(userName: string, password: string): Promise<void> {
        await this.userNameInput.fill(userName);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}
