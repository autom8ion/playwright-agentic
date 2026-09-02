import { config as loadEnv } from 'dotenv';

loadEnv({ path: 'env/.env' });

function required(name: string, fallback?: string): string {
    const value = process.env[name] ?? fallback;
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}. Copy env/.env.example to env/.env.`);
    }
    return value;
}

export const Env = {
    baseUrl: process.env.BASE_URL ?? 'https://demoqa.com',
    apiUrl: process.env.API_URL ?? 'https://demoqa.com',
    get demoqaUsername(): string {
        return required('DEMOQA_USERNAME');
    },
    get demoqaPassword(): string {
        return required('DEMOQA_PASSWORD');
    },
    // A second, separate account for API-only auth. demoqa allows only one
    // active token per account — reusing the UI account here would invalidate
    // whichever of (browser storage state, API session) authenticated last.
    // See .claude/skills/auth-storage-state.
    get demoqaApiUsername(): string {
        return required('DEMOQA_API_USERNAME');
    },
    get demoqaApiPassword(): string {
        return required('DEMOQA_API_PASSWORD');
    },
};
