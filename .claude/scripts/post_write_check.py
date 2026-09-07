#!/usr/bin/env python3
"""
PostToolUse hook: after a Write/Edit/MultiEdit (or the generator agent's
generator_write_test) lands a TypeScript file in the test code tree, run
eslint on that file and `tsc --noEmit` on the project, and hand only the
error lines back to the model as additionalContext. The model learns about a
type error on the turn it wrote the file, instead of the caller discovering
it after the agent has already stopped.

Report-only by design: it never rewrites the file (that would invalidate the
model's read state and force a re-read). Formatting is applied once at the
end by the orchestrator / pre-commit hook via `npm run format`.

Always exits 0 — PostToolUse cannot block.
"""
import json
import subprocess
import sys
from pathlib import Path

WATCHED_DIRS = ("tests/", "pages/", "fixtures/", "test-data/", "enums/", "helpers/", "config/")
MAX_LINES = 20


def rel_path(raw: str) -> str:
    p = Path(raw)
    if p.is_absolute():
        try:
            p = p.resolve().relative_to(Path.cwd().resolve())
        except ValueError:
            return ""
    return p.as_posix()


def run(cmd, timeout=120):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return (r.stdout + r.stderr).strip()
    except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
        return f"(could not run {' '.join(cmd)}: {exc})"


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    tool_input = payload.get("tool_input", {}) or {}
    raw = tool_input.get("file_path") or tool_input.get("fileName") or ""
    path = rel_path(raw)
    if not path.endswith(".ts") or not path.startswith(WATCHED_DIRS) or not Path(path).exists():
        return 0

    problems = []

    eslint_out = run(["npx", "eslint", "--max-warnings", "0", "--format", "unix", path])
    if eslint_out and "problem" in eslint_out.lower() or (eslint_out and ":" in eslint_out and path in eslint_out):
        problems += [l for l in eslint_out.splitlines() if path in l][:MAX_LINES]

    tsc_out = run(["npx", "tsc", "--noEmit", "--pretty", "false"])
    if tsc_out:
        mine = [l for l in tsc_out.splitlines() if l.startswith(path)]
        others = [l for l in tsc_out.splitlines() if "error TS" in l and not l.startswith(path)]
        problems += mine[:MAX_LINES]
        if others:
            problems.append(f"(tsc also reports {len(others)} error(s) in other files — run `npm run typecheck`)")

    if not problems:
        return 0

    context = (
        f"Checks on {path} found problems. Fix them before moving on (do not weaken the test to silence them):\n"
        + "\n".join(problems[: MAX_LINES + 1])
    )
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": context}}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
