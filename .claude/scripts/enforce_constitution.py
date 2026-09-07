#!/usr/bin/env python3
"""
PreToolUse hook: mechanically blocks Write/Edit/MultiEdit calls — and the
Playwright test-generator agent's "generator_write_test" MCP tool, which
writes files the same way but bypasses the native tools entirely — that
would introduce known anti-patterns from the Constitution (see CLAUDE.md
and .claude/skills/*/SKILL.md). This is a hard backstop beneath
prompt-level rules — it does not replace them, and it only catches what's
cheap and reliable to detect with regex over the text a tool call is about
to write.

Protocol: reads the PreToolUse JSON payload on stdin. Exit 0 = allow.
Exit 2 + a message on stderr = block; Claude Code shows that message to
the model as the reason the edit was rejected.

Self-test: `python3 .claude/scripts/enforce_constitution.py --self-test`
(also wired to `npm run check:hook`).
"""
import json
import os
import re
import sys
from pathlib import Path

RULES = []
WHOLE_FILE_RULES = []


def rule(applies_to, pattern, message, flags=re.IGNORECASE):
    RULES.append({"applies_to": applies_to, "regex": re.compile(pattern, flags), "message": message})


def whole_file_rule(applies_to, check):
    """check(text) -> error message or None. Only runs on full-file writes."""
    WHOLE_FILE_RULES.append({"applies_to": applies_to, "check": check})


def normalize(file_path: str) -> str:
    """Repo-relative POSIX path. Native Write/Edit pass absolute paths; the
    generator MCP tool and hand-written payloads may pass relative ones."""
    p = Path(file_path)
    if p.is_absolute():
        try:
            p = p.resolve().relative_to(Path.cwd().resolve())
        except ValueError:
            pass  # outside the repo — keep as-is, rules keyed on repo dirs won't match
    return p.as_posix()


def path_has_part(file_path: str, part: str) -> bool:
    return part in file_path


def is_spec_file(file_path: str) -> bool:
    return file_path.startswith("tests/app/") and file_path.endswith(".spec.ts")


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

# 7. Specs don't own locators — they come from page objects via fixtures.
rule(
    applies_to=is_spec_file,
    pattern=r"\bpage\.(locator|getBy(Role|Label|Placeholder|Text|TestId|Title|AltText))\s*\(",
    message=(
        "Blocked: specs never call page.locator()/page.getBy*(). Put the locator "
        "on the page object in pages/*.ts (as a getter) and reach it through the "
        "fixture. See .claude/skills/page-objects."
    ),
)

# 8. Specs don't construct page objects.
rule(
    applies_to=is_spec_file,
    pattern=r"\bnew\s+\w+Page\s*\(",
    message=(
        "Blocked: specs never do `new SomePage(page)`. Every page object is a "
        "fixture — destructure it from the test callback. See .claude/skills/fixtures-di."
    ),
)

# 9. Specs import only from test-options, not a lower fixture layer.
rule(
    applies_to=is_spec_file,
    pattern=r"""from\s+['"][^'"]*fixtures/pom/(?!test-options['"])""",
    message=(
        "Blocked: specs import only from 'fixtures/pom/test-options' — never a "
        "single fixture layer directly. See .claude/skills/fixtures-di."
    ),
)

# 10. Exactly one tag per test(), on the test() call (full-file writes only).
TEST_CALL = re.compile(r"^\s*test\(", re.MULTILINE)
TAG_OPTION = re.compile(r"\btag:\s*(['\"`]@\w+['\"`]|Tag\.\w+)")
TAG_ARRAY = re.compile(r"\btag:\s*\[")
STEP_CALL = re.compile(r"test\.step\(\s*[`'\"](GIVEN|WHEN|THEN|AND)\b")


def check_tags_and_steps(text: str):
    tests = len(TEST_CALL.findall(text))
    if tests == 0:
        return None
    if TAG_ARRAY.search(text):
        return (
            "Blocked: exactly one tag per test() — pass `{ tag: '@sanity' }`, "
            "not an array. See .claude/skills/tagging."
        )
    tags = len(TAG_OPTION.findall(text))
    if tags < tests:
        return (
            f"Blocked: {tests} test() call(s) but only {tags} `tag:` option(s). Every "
            "test() takes exactly one of @smoke/@sanity/@regression/@e2e/@api/@destructive "
            "in its options object. See .claude/skills/tagging."
        )
    if not STEP_CALL.search(text):
        return (
            "Blocked: no `test.step('GIVEN/WHEN/THEN …')` found. Wrap the test body "
            "in GIVEN / WHEN / THEN (/ AND) steps. See CLAUDE.md rule 5."
        )
    return None


whole_file_rule(is_spec_file, check_tags_and_steps)


GENERATOR_WRITE_TOOL = "mcp__playwright-test__generator_write_test"
FULL_FILE_TOOLS = ("Write", GENERATOR_WRITE_TOOL)


def extract_texts(tool_name: str, tool_input: dict):
    """Yield the text blob(s) about to be written for this tool call."""
    if tool_name == "Write":
        yield tool_input.get("content", "")
    elif tool_name == "Edit":
        yield tool_input.get("new_string", "")
    elif tool_name == "MultiEdit":
        for edit in tool_input.get("edits", []) or []:
            yield edit.get("new_string", "")
    elif tool_name == GENERATOR_WRITE_TOOL:
        yield tool_input.get("code", "")


def extract_file_path(tool_name: str, tool_input: dict) -> str:
    if tool_name == GENERATOR_WRITE_TOOL:
        return tool_input.get("fileName", "")
    return tool_input.get("file_path", "")


def evaluate(payload: dict):
    """Return (exit_code, message)."""
    tool_name = payload.get("tool_name", "")
    if tool_name not in ("Write", "Edit", "MultiEdit", GENERATOR_WRITE_TOOL):
        return 0, ""

    tool_input = payload.get("tool_input", {}) or {}
    raw_path = extract_file_path(tool_name, tool_input)
    if not raw_path:
        return 0, ""
    file_path = normalize(raw_path)

    texts = list(extract_texts(tool_name, tool_input))

    for r in RULES:
        if not r["applies_to"](file_path):
            continue
        for text in texts:
            if r["regex"].search(text):
                return 2, r["message"] + f"\n(file: {file_path})\n"

    if tool_name in FULL_FILE_TOOLS:
        for r in WHOLE_FILE_RULES:
            if not r["applies_to"](file_path):
                continue
            for text in texts:
                msg = r["check"](text)
                if msg:
                    return 2, msg + f"\n(file: {file_path})\n"

    return 0, ""


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    code, msg = evaluate(payload)
    if msg:
        sys.stderr.write(msg)
    return code


# --- self-test -----------------------------------------------------------------

GOOD_SPEC = """import { expect, test } from '../../../fixtures/pom/test-options';

test('should do a thing', { tag: '@sanity' }, async ({ webTablesPage }) => {
    await test.step('GIVEN the page', async () => {
        await webTablesPage.goto();
    });
});
"""


def self_test() -> int:
    abs_spec = os.path.join(os.getcwd(), "tests/app/functional/x.spec.ts")
    cases = [
        # (name, payload, expected_exit)
        ("good spec, relative path", w("tests/app/functional/x.spec.ts", GOOD_SPEC), 0),
        ("good spec, absolute path", w(abs_spec, GOOD_SPEC), 0),
        ("good spec via generator tool", g("tests/app/functional/x.spec.ts", GOOD_SPEC), 0),
        ("@playwright/test import, absolute path", w(abs_spec, GOOD_SPEC.replace("../../../fixtures/pom/test-options", "@playwright/test")), 2),
        ("page.locator in spec", w(abs_spec, GOOD_SPEC.replace("await webTablesPage.goto();", "await page.locator('#x').click();")), 2),
        ("page.getByRole in spec", w(abs_spec, GOOD_SPEC.replace("await webTablesPage.goto();", "await page.getByRole('button').click();")), 2),
        ("new XPage in spec", w(abs_spec, GOOD_SPEC.replace("await webTablesPage.goto();", "const p = new WebTablesPage(page);")), 2),
        ("lower fixture layer import", w(abs_spec, GOOD_SPEC.replace("fixtures/pom/test-options", "fixtures/pom/helper-fixture")), 2),
        ("missing tag", w(abs_spec, GOOD_SPEC.replace("{ tag: '@sanity' }, ", "")), 2),
        ("tag array", w(abs_spec, GOOD_SPEC.replace("{ tag: '@sanity' }", "{ tag: ['@sanity', '@smoke'] }")), 2),
        ("missing GIVEN/WHEN/THEN steps", w(abs_spec, GOOD_SPEC.replace("GIVEN the page", "setup")), 2),
        ("tag on describe", w(abs_spec, "test.describe('x', { tag: '@smoke' }, () => {});\n" + GOOD_SPEC), 2),
        ("waitForTimeout in page object", w(os.path.join(os.getcwd(), "pages/XPage.ts"), "await this.page.waitForTimeout(500);"), 2),
        ("xpath in page object", w("pages/XPage.ts", "this.page.locator('//div');"), 2),
        ("z.object in schema", w("test-data/schemas/x.ts", "z.object({})"), 2),
        ("json static data", w("test-data/static/x.json", "{}"), 2),
        ("Edit partial: no tag check", e(abs_spec, "await expect(x).toBeVisible();"), 0),
        ("Edit partial: still blocks page.locator", e(abs_spec, "await page.locator('#x').click();"), 2),
        ("page object may use page.locator", w("pages/XPage.ts", "return this.page.locator('#confirmResult');"), 0),
        ("non-repo file untouched", w("/etc/hosts", "waitForTimeout("), 0),
        ("unrelated tool", {"tool_name": "Bash", "tool_input": {"command": "waitForTimeout("}}, 0),
    ]
    failures = 0
    for name, payload, expected in cases:
        code, msg = evaluate(payload)
        ok = code == expected
        failures += 0 if ok else 1
        print(f"{'ok  ' if ok else 'FAIL'} {name} (exit {code}, expected {expected})")
        if not ok and msg:
            print("     " + msg.strip().splitlines()[0])
    print(f"{len(cases) - failures}/{len(cases)} hook self-tests passed")
    return 1 if failures else 0


def w(path, content):
    return {"tool_name": "Write", "tool_input": {"file_path": path, "content": content}}


def e(path, new_string):
    return {"tool_name": "Edit", "tool_input": {"file_path": path, "old_string": "x", "new_string": new_string}}


def g(path, code):
    return {"tool_name": GENERATOR_WRITE_TOOL, "tool_input": {"fileName": path, "code": code}}


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        sys.exit(self_test())
    sys.exit(main())
