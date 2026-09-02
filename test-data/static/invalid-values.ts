/**
 * Static, immutable boundary/invalid-value fixtures. Reused across specs —
 * never generated, never JSON (see .claude/skills/data-strategy).
 */
/**
 * Both reach the server and trigger the app's "Invalid username or
 * password!" banner. Empty fields are deliberately excluded here — the
 * login form's HTML `required` validation blocks submission before the
 * request ever reaches the server, so it never shows this message.
 */
export const INVALID_CREDENTIALS = [
    { userName: 'not-a-real-user', password: 'WrongPass1!', label: 'unknown username' },
    { userName: 'another-unknown-user', password: 'WrongPass1!', label: 'a different unknown username' },
] as const;

export const INVALID_ISBN_VALUES = ['', 'not-an-isbn', '0000000000000'] as const;
