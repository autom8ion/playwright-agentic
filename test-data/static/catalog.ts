/**
 * demoqa's BookStore catalog is fixed and seeded server-side — these ISBNs
 * are stable across runs, so they're static data rather than generated.
 */
export const CATALOG_BOOKS = {
    gitPocketGuide: { isbn: '9781449325862', title: 'Git Pocket Guide' },
    learningJavaScriptDesignPatterns: { isbn: '9781449331818', title: 'Learning JavaScript Design Patterns' },
} as const;
