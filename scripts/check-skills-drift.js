// Catches drift between CLAUDE.md's skills index and .claude/skills/:
//   - every `.claude/skills/<name>/SKILL.md` referenced in CLAUDE.md must exist
//   - every skill directory that exists must be referenced from CLAUDE.md
//   - each SKILL.md's frontmatter `name:` must match its directory name
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKILLS_DIR = '.claude/skills';
const claudeMd = readFileSync('CLAUDE.md', 'utf-8');

const referenced = new Set([...claudeMd.matchAll(/\.claude\/skills\/([a-z0-9-]+)\/SKILL\.md/g)].map((m) => m[1]));

const onDisk = readdirSync(SKILLS_DIR).filter((entry) => statSync(join(SKILLS_DIR, entry)).isDirectory());

const errors = [];

for (const name of onDisk) {
    const skillPath = join(SKILLS_DIR, name, 'SKILL.md');
    let frontmatterName;
    try {
        const content = readFileSync(skillPath, 'utf-8');
        frontmatterName = content.match(/^name:\s*(\S+)/m)?.[1];
    } catch {
        errors.push(`${SKILLS_DIR}/${name}/ has no SKILL.md.`);
        continue;
    }
    if (frontmatterName !== name) {
        errors.push(`${skillPath} frontmatter name "${frontmatterName}" does not match directory "${name}".`);
    }
    if (!referenced.has(name)) {
        errors.push(`${skillPath} exists but is not referenced anywhere in CLAUDE.md.`);
    }
}

for (const name of referenced) {
    if (!onDisk.includes(name)) {
        errors.push(`CLAUDE.md references .claude/skills/${name}/SKILL.md, which doesn't exist.`);
    }
}

if (errors.length > 0) {
    console.error('Skills drift check failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
    process.exit(1);
}

console.log(`Skills drift check passed (${onDisk.length} skills, all referenced and consistent).`);
