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
        // Root cause of the observed flake: clicking Login triggers two *sequential*
        // external calls (POST /Account/v1/GenerateToken, then POST /Account/v1/Login)
        // before the SPA even starts navigating, showing "Loading…" on /login the whole
        // time. Confirmed live: ~2s combined on a quiet connection, but demoqa's backend
        // is slow/variable, so that chain can exceed the suite-wide 5s expect timeout
        // even though the login itself succeeds a moment later. Give this one assertion
        // headroom for that two-hop chain instead of racing the default timeout.
        await expect(page).toHaveURL(/\/profile$/, { timeout: 15_000 });
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
