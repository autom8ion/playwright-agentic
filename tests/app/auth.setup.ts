import { mkdirSync, writeFileSync } from 'node:fs';
import { expect } from '@playwright/test';
import { test as setup } from '../../fixtures/pom/page-object-fixture';
import { Env } from '../../config/env';
import { authenticateDemoqaUser } from '../../helpers/auth';

const AUTH_DIR = '.auth/app';
const STORAGE_STATE_PATH = `${AUTH_DIR}/appStorageState.json`;
const API_SESSION_PATH = `${AUTH_DIR}/apiSession.json`;

setup('authenticate', async ({ page, loginPage }) => {
    mkdirSync(AUTH_DIR, { recursive: true });

    await setup.step('GIVEN two demoqa test users (see scripts/setup-test-user.ts)', async () => {
        // Env.demoqa*/demoqaApi* throw with setup instructions if unset.
        void Env.demoqaUsername;
        void Env.demoqaPassword;
        void Env.demoqaApiUsername;
        void Env.demoqaApiPassword;
    });

    await setup.step('WHEN authenticating via the browser to capture storage state', async () => {
        await loginPage.goto();
        await loginPage.login(Env.demoqaUsername, Env.demoqaPassword);
        await expect(page).toHaveURL(/\/profile$/);
        await page.context().storageState({ path: STORAGE_STATE_PATH });
    });

    // Uses a separate account on purpose: demoqa keeps only one active token
    // per account, so authenticating this on the *same* account as the
    // browser login above would invalidate whichever token was issued first.
    // See .claude/skills/auth-storage-state.
    await setup.step('AND authenticating via the Account API', async () => {
        const { userId, token } = await authenticateDemoqaUser(Env.demoqaApiUsername, Env.demoqaApiPassword);
        writeFileSync(API_SESSION_PATH, JSON.stringify({ userId, token }, null, 2));
    });
});
