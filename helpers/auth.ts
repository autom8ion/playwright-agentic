import { Env } from '../config/env';
import { Endpoints } from '../enums/endpoints';
import {
    CreateUserResponseSchema,
    GenerateTokenResponseSchema,
    LoginResponseSchema,
    type CreateUserResponse,
    type GenerateTokenResponse,
    type LoginResponse,
} from '../test-data/schemas/account-schema';

async function postJson<T>(path: string, body: unknown): Promise<{ status: number; body: T }> {
    const response = await fetch(`${Env.apiUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = (await response.json()) as T;
    return { status: response.status, body: json };
}

export async function createDemoqaUser(userName: string, password: string): Promise<CreateUserResponse> {
    const { status, body } = await postJson<CreateUserResponse>(Endpoints.account.createUser, { userName, password });
    if (status !== 201) {
        throw new Error(`Failed to create demoqa user "${userName}" (status ${status}): ${JSON.stringify(body)}`);
    }
    return CreateUserResponseSchema.parse(body);
}

// /Account/v1/Login: gives us userId, but its `token` stays null until
// GenerateToken has been called at least once for this user — it's not a
// usable auth mechanism on its own.
export async function loginDemoqaUser(userName: string, password: string): Promise<LoginResponse> {
    const { status, body } = await postJson<LoginResponse>(Endpoints.account.login, { userName, password });
    if (status !== 200) {
        throw new Error(`Failed to log in demoqa user "${userName}" (status ${status}): ${JSON.stringify(body)}`);
    }
    return LoginResponseSchema.parse(body);
}

// /Account/v1/GenerateToken: the endpoint that actually issues a bearer token.
export async function generateDemoqaToken(userName: string, password: string): Promise<GenerateTokenResponse> {
    const { status, body } = await postJson<GenerateTokenResponse>(Endpoints.account.generateToken, {
        userName,
        password,
    });
    if (status !== 200) {
        throw new Error(
            `Failed to generate a demoqa token for "${userName}" (status ${status}): ${JSON.stringify(body)}`,
        );
    }
    const parsed = GenerateTokenResponseSchema.parse(body);
    if (parsed.status !== 'Success') {
        throw new Error(`Token generation for "${userName}" was not successful: ${parsed.result}`);
    }
    return parsed;
}

export type DemoqaSession = {
    userId: string;
    token: string;
};

/** Combines Login (for userId) and GenerateToken (for a real bearer token) into one authenticated session. */
export async function authenticateDemoqaUser(userName: string, password: string): Promise<DemoqaSession> {
    const [{ userId }, { token }] = await Promise.all([
        loginDemoqaUser(userName, password),
        generateDemoqaToken(userName, password),
    ]);
    return { userId, token };
}
