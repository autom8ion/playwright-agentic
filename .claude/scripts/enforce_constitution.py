#!/usr/bin/env python3
"""
PreToolUse hook: mechanically blocks Write/Edit/MultiEdit calls that would
introduce known anti-patterns from the Constitution (see CLAUDE.md and
.claude/skills/*/SKILL.md). This is a hard backstop beneath prompt-level
rules — it does not replace them, and it only catches what's cheap and
reliable to detect with regex over the text a tool call is about to write.

Protocol: reads the PreToolUse JSON payload on stdin. Exit 0 = allow.
Exit 2 + a message on stderr = block; Claude Code shows that message to
the model as the reason the edit was rejected.
"""
import json
import re
import sys
from pathlib import Path

RULES = []


def rule(applies_to, pattern, message, flags=re.IGNORECASE):
    RULES.append(
        {
            "applies_to": applies_to,
            "regex": re.compile(pattern, flags),
            "message": message,
        }
    )


def path_has_part(file_path: str, part: str) -> bool:
    return part in Path(file_path).as_posix()


def is_spec_file(file_path: str) -> bool:
    posix = Path(file_path).as_posix()
    return posix.startswith("tests/app/") and posix.endswith(".spec.ts")


# 1. No hard waits — use web-first assertions instead.
rule(
    applies_to=lambda p: p.endswith(".ts"),
    pattern=r"waitForTimeout\s*\(",
    message=(
        "Blocked: waitForTimeout() is a hard wait. Use a web-first assertion "
        "(e.g. expect(locator).toBeVisible()) or an explicit wait for the "
        "condition you actually care about. See .claude/skills/locators-assertions."
    ),
)

# 2. API response schemas must be strict.
rule(
    applies_to=lambda p: path_has_part(p, "test-data/schemas"),
    pattern=r"\bz\.object\s*\(",
    message=(
        "Blocked: use z.strictObject(...) instead of z.object(...) for API "
        "response schemas, so unexpected fields fail the contract check. "
        "See .claude/skills/api-testing."
    ),
)

# 3. No XPath selectors in pages or tests.
rule(
    applies_to=lambda p: path_has_part(p, "pages/") or path_has_part(p, "tests/"),
    pattern=r"""(xpath\s*=|\.locator\(\s*['"`]\s*//|\.locator\(\s*['"`]\s*xpath=)""",
    message=(
        "Blocked: XPath selectors aren't allowed. Prefer getByRole/getByLabel/"
        "getByPlaceholder/getByText/getByTestId, and only fall back to a plain "
        "CSS locator as a last resort. See .claude/skills/locators-assertions."
    ),
)

# 4. Specs must import test/expect from the merged fixture, not @playwright/test.
rule(
    applies_to=is_spec_file,
    pattern=r"""from\s+['"]@playwright/test['"]""",
    message=(
        "Blocked: test specs must import { test, expect } from "
        "'fixtures/pom/test-options', not '@playwright/test' directly, so every "
        "test gets the merged page-object/API/helper fixtures. "
        "See .claude/skills/fixtures-di."
    ),
)

# 5. No JSON static test data files.
rule(
    applies_to=lambda p: path_has_part(p, "test-data/static") and p.endswith(".json"),
    pattern=r".",  # any content — the file path alone is the violation
    message=(
        "Blocked: static test data must be TypeScript with `as const`, not "
        ".json. This keeps invalid/boundary values type-checked and diffable. "
        "See .claude/skills/data-strategy."
    ),
)

# 6. No @functional tag, and no tags on test.describe().
rule(
    applies_to=lambda p: path_has_part(p, "tests/"),
    pattern=r"""(['"]@functional['"]|test\.describe\([^)]*tag\s*:)""",
    message=(
        "Blocked: '@functional' isn't a real tag (the tests/functional folder "
        "already implies it), and tags belong on individual test() calls, "
        "never on test.describe(). See .claude/skills/tagging."
    ),
)


def extract_texts(tool_name: str, tool_input: dict):
    """Yield the text blob(s) about to be written for this tool call."""
    if tool_name == "Write":
        yield tool_input.get("content", "")
    elif tool_name == "Edit":
        yield tool_input.get("new_string", "")
    elif tool_name == "MultiEdit":
        for edit in tool_input.get("edits", []) or []:
            yield edit.get("new_string", "")


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    tool_name = payload.get("tool_name", "")
    if tool_name not in ("Write", "Edit", "MultiEdit"):
        return 0

    tool_input = payload.get("tool_input", {}) or {}
    file_path = tool_input.get("file_path", "")
    if not file_path:
        return 0

    texts = list(extract_texts(tool_name, tool_input))

    for r in RULES:
        if not r["applies_to"](file_path):
            continue
        for text in texts:
            if r["regex"].search(text):
                sys.stderr.write(r["message"] + f"\n(file: {file_path})\n")
                return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
