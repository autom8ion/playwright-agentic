import { faker } from '@faker-js/faker';

export type GeneratedUser = {
    userName: string;
    password: string;
};

/**
 * demoqa's Account API rejects passwords that don't satisfy its complexity
 * regex (8+ chars, upper, lower, number, special char) with a generic 400 —
 * the special-char suffix guarantees every generated password clears it.
 */
export function generateUser(): GeneratedUser {
    const userName = `${faker.internet.username()}_${faker.string.alphanumeric(6)}`;
    const password = `${faker.internet.password({ length: 10, memorable: false })}Aa1!`;

    return { userName, password };
}
