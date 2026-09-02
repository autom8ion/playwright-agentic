# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-09-02

### Added

- Initial scaffold: Constitution (`CLAUDE.md`), skills (`.claude/skills/`), and the
  `enforce_constitution.py` PreToolUse hook.
- Page Object Model layer for demoqa.com (Login, Book Store, Profile).
- Fixture-based dependency injection (`fixtures/pom/test-options.ts`).
- API testing layer with Zod schema validation against the demoqa Account/BookStore API.
- Faker-based data factories plus static boundary/invalid-value test data.
- `auth.setup.ts` storage-state pattern (API token + browser session).
- CI workflow, Husky pre-commit hooks, and version/skills-drift checks.
