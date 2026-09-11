import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import { LIGHTHOUSE_CDP_PORT } from './helpers/lighthouse';

loadEnv({ path: 'env/.env' });

const BASE_URL = process.env.BASE_URL ?? 'https://demoqa.com';

export default defineConfig({
    testDir: './tests/app',
    timeout: 30_000,
    expect: {
        timeout: 5_000,
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI
        ? [
              ['github'],
              ['html', { open: 'never' }],
              ['junit', { outputFile: 'test-results/junit.xml' }],
              // CTRF (https://ctrf.io): framework-agnostic JSON report consumed by the
              // KPI-Dashboard qa_collector alongside the JUnit XML above. Its own
              // `flaky`/`retries` fields (meaningful here since CI sets retries: 2) are
              // a stronger flaky-test signal than qa_collector's own history-based one.
              [
                  'playwright-ctrf-json-reporter',
                  { outputDir: 'ctrf', outputFile: 'ctrf-report.json', appName: 'playwright-agentic' },
              ],
          ]
        : [['list'], ['html', { open: 'never' }]],

    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },
        {
            name: 'chromium',
            testIgnore: '**/lighthouse/**',
            use: {
                ...devices['Desktop Chrome'],
                storageState: '.auth/app/appStorageState.json',
            },
            dependencies: ['setup'],
        },
        {
            // Lighthouse audits (tests/app/lighthouse/) — kept out of the default `chromium`
            // project since they need a fixed CDP debugging port (playwright-lighthouse
            // connects to the running browser over it) and don't need trace/video capture.
            // `workers: 1` means the fixed port is never shared by two browser instances at
            // once; see helpers/lighthouse.ts and .github/workflows/lighthouse.yml. A full
            // audit run (4 categories) regularly takes 15-25s on its own, well past the
            // suite-wide 30s test timeout, so this project gets its own longer one.
            name: 'lighthouse',
            testDir: './tests/app/lighthouse',
            workers: 1,
            timeout: 90_000,
            use: {
                ...devices['Desktop Chrome'],
                storageState: '.auth/app/appStorageState.json',
                launchOptions: {
                    args: [`--remote-debugging-port=${LIGHTHOUSE_CDP_PORT}`],
                },
                trace: 'off',
                video: 'off',
                screenshot: 'off',
            },
            dependencies: ['setup'],
        },
    ],
});
