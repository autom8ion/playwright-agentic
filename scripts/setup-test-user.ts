/**
 * One-off setup: creates two persistent demoqa BookStore accounts and writes
 * their credentials to env/.env. Two accounts on purpose — demoqa allows
 * only one active token per account, so a browser login and a later API
 * GenerateToken call on the *same* account invalidate each other (see
 * .claude/skills/auth-storage-state). Run once via `npm run setup:user`;
 * re-run is a no-op for any pair that's already set, so it's safe on a
 * shared machine.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { generateUser } from '../test-data/factories/user-factory';
import { createDemoqaUser } from '../helpers/auth';

const ENV_PATH = 'env/.env';
const EXAMPLE_PATH = 'env/.env.example';

const ACCOUNTS = [
    { usernameVar: 'DEMOQA_USERNAME', passwordVar: 'DEMOQA_PASSWORD', label: 'UI' },
    { usernameVar: 'DEMOQA_API_USERNAME', passwordVar: 'DEMOQA_API_PASSWORD', label: 'API' },
] as const;

function readEnvFile(): string {
    return existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf-8') : readFileSync(EXAMPLE_PATH, 'utf-8');
}

function isSet(content: string, varName: string): boolean {
    return new RegExp(`^${varName}=\\S`, 'm').test(content);
}

async function main(): Promise<void> {
    let content = readEnvFile();

    for (const account of ACCOUNTS) {
        if (isSet(content, account.usernameVar)) {
            console.log(`${account.usernameVar} is already set — leaving the ${account.label} account untouched.`);
            continue;
        }

        const { userName, password } = generateUser();
        await createDemoqaUser(userName, password);

        content = content
            .replace(new RegExp(`^${account.usernameVar}=.*$`, 'm'), `${account.usernameVar}=${userName}`)
            .replace(new RegExp(`^${account.passwordVar}=.*$`, 'm'), `${account.passwordVar}=${password}`);

        console.log(`Created demoqa ${account.label} test user "${userName}".`);
    }

    writeFileSync(ENV_PATH, content);
    console.log(`Wrote credentials to ${ENV_PATH}.`);
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
