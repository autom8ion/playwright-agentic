/**
 * Single import point for every test spec. Never import `@playwright/test`
 * or a single fixture file directly — see .claude/skills/fixtures-di.
 */
export { expect } from '@playwright/test';
export { test } from './helper-fixture';
export type { ApiSession } from './helper-fixture';
export type { ApiRequestOptions, ApiResponse } from './api-request-fixture';
