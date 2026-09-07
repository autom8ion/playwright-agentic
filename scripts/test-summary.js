// Runs Playwright (or reads an existing report) and prints a compact, stable digest
// instead of the full runner output — one summary line plus one line per non-passing
// test. Built for agents: a 20-test failing run is ~20 lines here instead of thousands.
//
//   npm run test:summary -- <any playwright test args>      run, then summarize
//   (no --grep/--grep-invert given → @destructive is excluded, same as `npm test`)
//   npm run test:summary -- --from-json test-results/last-run.json
//   npm run test:summary -- --from-ctrf ctrf/ctrf-report.json
//
// Exit code mirrors the Playwright run (0 green, 1 failures) so callers can chain on it.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';

const JSON_OUT = 'test-results/last-run.json';
const CAUSE_MAX = 140;
const MAX_LINES = 40;
const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');

const args = process.argv.slice(2);
const fromIdx = args.findIndex((a) => a === '--from-json' || a === '--from-ctrf');

let exitCode = 0;
let reportPath;
let isCtrf = false;

if (fromIdx >= 0) {
    isCtrf = args[fromIdx] === '--from-ctrf';
    reportPath = args[fromIdx + 1];
    if (!reportPath || !existsSync(reportPath)) {
        console.error(`test-summary: report not found: ${reportPath}`);
        process.exit(2);
    }
} else {
    mkdirSync('test-results', { recursive: true });
    // Mirror `npm test`: unless the caller filtered explicitly, keep @destructive out — it
    // mutates the shared demoqa collection and belongs in `npm run test:destructive`.
    const filtered = args.some((a) => a.startsWith('--grep') || a === '-g');
    const runArgs = filtered ? args : [...args, '--grep-invert', '@destructive'];
    const run = spawnSync('npx', ['playwright', 'test', ...runArgs, '--reporter=json'], {
        stdio: ['inherit', 'ignore', 'inherit'],
        env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: JSON_OUT },
    });
    exitCode = run.status ?? 1;
    reportPath = JSON_OUT;
    if (!existsSync(reportPath)) {
        console.error(
            `test-summary: playwright produced no report (exit ${exitCode}) — bad args or config error above`,
        );
        process.exit(exitCode || 2);
    }
}

const report = JSON.parse(readFileSync(reportPath, 'utf-8'));
const rows = isCtrf ? fromCtrf(report) : fromPlaywrightJson(report);
print(rows);
process.exit(exitCode);

// --- Playwright JSON reporter ---------------------------------------------------------
function fromPlaywrightJson(json) {
    const tests = [];
    const walk = (suite, fileFromParent) => {
        const file = suite.file ?? fileFromParent;
        for (const spec of suite.specs ?? []) {
            for (const t of spec.tests ?? []) {
                const results = t.results ?? [];
                const last = results[results.length - 1] ?? {};
                const firstError = results.find((r) => r.error)?.error;
                tests.push({
                    file: spec.file ?? file,
                    title: spec.title,
                    status: t.status, // expected | unexpected | flaky | skipped
                    retries: results.length - 1,
                    cause: firstError ? firstLine(firstError.message) : last.status === 'timedOut' ? 'timed out' : '',
                });
            }
        }
        for (const child of suite.suites ?? []) walk(child, file);
    };
    for (const s of json.suites ?? []) walk(s);
    // The JSON reporter's file paths are relative to testDir; make them repo-relative so they're
    // directly usable as `npx playwright test <file>` arguments and clickable in the terminal.
    const rootDir = json.config?.rootDir;
    if (rootDir) {
        const prefix = relative(process.cwd(), rootDir);
        if (prefix) for (const t of tests) t.file = `${prefix}/${t.file}`;
    }
    const stats = json.stats ?? {};
    return {
        pass: stats.expected ?? 0,
        fail: stats.unexpected ?? 0,
        flaky: stats.flaky ?? 0,
        skipped: stats.skipped ?? 0,
        duration: stats.duration ?? 0,
        tests,
    };
}

// --- CTRF (CI artifact) ---------------------------------------------------------------
function fromCtrf(json) {
    const r = json.results ?? {};
    const s = r.summary ?? {};
    const tests = (r.tests ?? []).map((t) => ({
        file: t.filePath ?? t.suite ?? '',
        title: t.name,
        status: t.flaky
            ? 'flaky'
            : t.status === 'passed'
              ? 'expected'
              : t.status === 'failed'
                ? 'unexpected'
                : 'skipped',
        retries: t.retries ?? 0,
        cause: t.message ? firstLine(t.message) : '',
    }));
    return {
        pass: s.passed ?? 0,
        fail: s.failed ?? 0,
        flaky: tests.filter((t) => t.status === 'flaky').length,
        skipped: (s.skipped ?? 0) + (s.pending ?? 0),
        duration: (s.stop ?? 0) - (s.start ?? 0),
        tests,
    };
}

// --- output -------------------------------------------------------------------------
function print({ pass, fail, flaky, skipped, duration, tests }) {
    console.log(`PASS ${pass}  FAIL ${fail}  FLAKY ${flaky}  SKIPPED ${skipped}  (${(duration / 1000).toFixed(1)}s)`);
    const interesting = tests.filter((t) => t.status !== 'expected' && t.status !== 'skipped');
    const lines = interesting.map((t) => {
        const label = t.status === 'flaky' ? 'FLAKY' : 'FAIL';
        const tail = t.status === 'flaky' ? `(passed on retry ${t.retries})` : t.cause || '(no error message)';
        return `${label} ${t.file} :: ${t.title} :: ${tail}`;
    });
    for (const l of lines.slice(0, MAX_LINES)) console.log(l);
    if (lines.length > MAX_LINES) console.log(`... ${lines.length - MAX_LINES} more; see ${reportPath}`);
    if (tests.length === 0) console.log('(no tests matched)');
}

function firstLine(message) {
    const clean = String(message)
        .replace(ANSI, '')
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.length > 0);
    return (clean ?? '').slice(0, CAUSE_MAX);
}
