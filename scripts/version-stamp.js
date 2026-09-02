// Writes a new version to VERSION and package.json together, so they can never drift.
// Usage: node scripts/version-stamp.js <x.y.z>
import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    console.error('Usage: node scripts/version-stamp.js <x.y.z>');
    process.exit(1);
}

writeFileSync('VERSION', `${version}\n`);

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
pkg.version = version;
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

console.log(`Stamped version ${version} into VERSION and package.json.`);
console.log(`Remember to add a "## [${version}]" entry to CHANGELOG.md.`);
