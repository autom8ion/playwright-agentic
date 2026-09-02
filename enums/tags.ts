/**
 * Every test carries exactly one of these tags (see .claude/skills/tagging).
 * `destructive` overrides all others and always runs with `--workers 1`.
 */
export const Tag = {
    smoke: '@smoke',
    sanity: '@sanity',
    regression: '@regression',
    e2e: '@e2e',
    api: '@api',
    destructive: '@destructive',
} as const;
