import fs from 'fs';
import path from 'path';

const THRESHOLDS = {
    statements: 80,
    branches: 70,
    functions: 90,
    lines: 80
};

const SUMMARY_PATH = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

interface CoverageMetric {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
}

interface FileCoverage {
    lines: CoverageMetric;
    statements: CoverageMetric;
    functions: CoverageMetric;
    branches: CoverageMetric;
}

interface CoverageSummary {
    total: FileCoverage;
    [filepath: string]: FileCoverage;
}

function formatPct(pct: number): string {
    if (isNaN(pct)) return '   0.00';
    return pct.toFixed(2).padStart(7);
}

function getRow(file: string, coverage: FileCoverage): string {
    return `${file.padEnd(60)} | ${formatPct(coverage.statements.pct)} | ${formatPct(coverage.branches.pct)} | ${formatPct(coverage.functions.pct)} | ${formatPct(coverage.lines.pct)} |`;
}

function isBelowThreshold(coverage: FileCoverage): boolean {
    return (
        coverage.statements.pct < THRESHOLDS.statements ||
        coverage.branches.pct < THRESHOLDS.branches ||
        coverage.functions.pct < THRESHOLDS.functions ||
        coverage.lines.pct < THRESHOLDS.lines
    );
}

function run() {
    if (!fs.existsSync(SUMMARY_PATH)) {
        console.error(`Coverage summary not found at ${SUMMARY_PATH}. Make sure to run vitest with json-summary reporter.`);
        process.exit(1);
    }

    const summary: CoverageSummary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));

    const header = `${'File'.padEnd(60)} | % Stmts | % Branch | % Funcs | % Lines |`;
    const separator = '-'.repeat(60) + '-|---------|----------|---------|---------|';

    console.log('\n % Pragmatic Coverage Report (Thresholds: Stmts: 80%, Branch: 70%, Funcs: 90%, Lines: 80%)');
    console.log(separator);
    console.log(header);
    console.log(separator);

    const files = Object.keys(summary).filter(k => k !== 'total').sort();

    let count = 0;
    for (const file of files) {
        const coverage = summary[file];
        if (isBelowThreshold(coverage)) {
            // Use relative path for readability, but it's the full path from root
            const relativePath = path.relative(process.cwd(), file);
            console.log(getRow(relativePath, coverage));
            count++;
        }
    }

    console.log(separator);
    console.log(getRow('All files', summary.total));
    console.log(separator);

    if (count === 0) {
        console.log(' All files meet the pragmatic coverage targets! 🎉');
    } else {
        console.log(` ${count} files are below pragmatic coverage targets.`);
    }
}

// Export for testing if needed
export { isBelowThreshold, THRESHOLDS };

if (import.meta.url === `file://${process.argv[1]}`) {
    run();
}
