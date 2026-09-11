import type { Page } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

// Must match the `--remote-debugging-port` arg on the `lighthouse` project's launchOptions
// in playwright.config.ts — Lighthouse connects to the already-running browser over this
// port instead of launching its own. That project also pins `workers: 1`, so a fixed port
// never collides with a second worker's browser instance.
export const LIGHTHOUSE_CDP_PORT = 9222;

export const LIGHTHOUSE_REPORT_DIR = 'lighthouse-report';

export type LighthouseThresholds = {
    performance: number;
    accessibility: number;
    'best-practices': number;
    seo: number;
};

// demoqa.com is a public demo site, not an app this repo controls — its performance varies
// build to build and it's known to be ad-heavy (see .claude/skills/app-notes). Floors stay
// well under 100, and below the lowest score observed live across its pages (performance
// 48-92, accessibility 78-80, best-practices 50-73, seo 75), so this pipeline catches a
// real regression instead of flaking on noise nobody here can fix. Tighten per-page via the
// `thresholds` param once a page's baseline is well understood.
const DEFAULT_THRESHOLDS: LighthouseThresholds = {
    performance: 30,
    accessibility: 60,
    'best-practices': 40,
    seo: 50,
};

export type LighthouseReportPaths = {
    html: string;
    json: string;
};

/**
 * Runs a Lighthouse audit against the page's current URL and persists HTML + JSON reports
 * under `LIGHTHOUSE_REPORT_DIR` (uploaded as a CI artifact by .github/workflows/lighthouse.yml).
 * Throws if any category falls under its threshold.
 */
export async function auditPage(
    page: Page,
    label: string,
    thresholds: Partial<LighthouseThresholds> = {},
): Promise<LighthouseReportPaths> {
    await playAudit({
        page,
        port: LIGHTHOUSE_CDP_PORT,
        thresholds: { ...DEFAULT_THRESHOLDS, ...thresholds },
        reports: {
            formats: { html: true, json: true },
            name: label,
            directory: LIGHTHOUSE_REPORT_DIR,
        },
    });

    return {
        html: `${LIGHTHOUSE_REPORT_DIR}/${label}.html`,
        json: `${LIGHTHOUSE_REPORT_DIR}/${label}.json`,
    };
}
