import { test as base } from '@playwright/test';

/**
 * First layer of the fixture chain: a `context` override that aborts third-party ad,
 * tag-manager, and analytics requests (demoqa.com loads Google ads/GTM on every page).
 * Keeps that noise out of the network logs and traces the Playwright agents inspect, and
 * out of the page when demoqa's ad iframes do render. No effect on the app under test.
 * Not an `auto` fixture on purpose — it only runs when a test (or the agents' seed-based
 * setup) actually asks for a browser context, so API-only specs never launch a browser.
 */
const BLOCKED_HOST_PATTERNS = [
    'googlesyndication.com',
    'doubleclick.net',
    'googleadservices.com',
    'adservice.google.',
    'googletagmanager.com',
    'google-analytics.com',
    'adtrafficquality.google',
    'adsbygoogle',
] as const;

export function isBlockedRequest(url: string): boolean {
    return BLOCKED_HOST_PATTERNS.some((pattern) => url.includes(pattern));
}

export const test = base.extend({
    context: async ({ context }, use) => {
        await context.route(
            (url) => isBlockedRequest(url.href),
            (route) => route.abort(),
        );
        await use(context);
    },
});
