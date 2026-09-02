// Verifies VERSION, package.json, and CHANGELOG.md agree. Run in CI and pre-commit.
import { readFileSync } from 'node:fs';

const version = readFileSync('VERSION', 'utf-8').trim();
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const changelog = readFileSync('CHANGELOG.md', 'utf-8');

const errors = [];

if (pkg.version !== version) {
    errors.push(`package.json version "${pkg.version}" does not match VERSION "${version}".`);
}

const changelogHeading = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`, 'm');
if (!changelogHeading.test(changelog)) {
    errors.push(`CHANGELOG.md has no "## [${version}]" entry.`);
}

if (errors.length > 0) {
    console.error('Version consistency check failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
    console.error('\nRun `npm run version:stamp <x.y.z>` and add a CHANGELOG.md entry.');
    process.exit(1);
}

console.log(`Version ${version} is consistent across VERSION, package.json, and CHANGELOG.md.`);
