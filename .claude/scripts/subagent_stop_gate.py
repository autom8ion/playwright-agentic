#!/usr/bin/env python3
"""
SubagentStop hook for the file-writing Playwright agents (generator, healer,
stabilizer): before the agent is allowed to finish, the project must
typecheck and the files it touched must lint. If not, exit 2 with the error
lines — Claude Code keeps the agent running with that message so it fixes
its own mistake rather than handing a broken tree back to the orchestrator.

Loop guard: each agent gets at most MAX_RETRIES blocked stops; after that the
stop is allowed with a systemMessage so the caller knows the tree is dirty.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

MAX_RETRIES = 2
MAX_LINES = 20


def run(cmd, timeout=180):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, (r.stdout + r.stderr).strip()
    except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
        return 0, f"(could not run {' '.join(cmd)}: {exc})"


def touched_ts_files():
    _, out = run(["git", "status", "--porcelain", "--untracked-files=all"])
    files = []
    for line in out.splitlines():
        name = line[3:].strip()
        if name.endswith(".ts") and Path(name).exists():
            files.append(name)
    return files


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    agent_id = payload.get("agent_id") or "unknown"
    counter = Path(tempfile.gettempdir()) / f"playwright-agentic-stopgate-{agent_id}"

    errors = []
    code, tsc_out = run(["npx", "tsc", "--noEmit", "--pretty", "false"])
    if code != 0:
        errors += [l for l in tsc_out.splitlines() if "error TS" in l][:MAX_LINES]

    files = touched_ts_files()
    if files:
        code, eslint_out = run(["npx", "eslint", "--max-warnings", "0", "--format", "unix", *files])
        if code != 0:
            errors += [l for l in eslint_out.splitlines() if ":" in l and not l.startswith("npm")][:MAX_LINES]

    if not errors:
        counter.unlink(missing_ok=True)
        return 0

    tries = int(counter.read_text()) if counter.exists() else 0
    if tries >= MAX_RETRIES:
        counter.unlink(missing_ok=True)
        print(json.dumps({"systemMessage": f"Subagent stopped with unresolved typecheck/lint errors after {tries} retries: " + " | ".join(errors[:3])}))
        return 0

    counter.write_text(str(tries + 1))
    sys.stderr.write(
        "Not done yet: the project must typecheck and lint before you stop. Fix these, "
        "then finish with your report (do not weaken tests to silence them):\n" + "\n".join(errors) + "\n"
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
