import { describe, it, expect } from 'vitest';
import { isBelowThreshold, THRESHOLDS } from '../../../scripts/filter-coverage';

describe('filter-coverage logic', () => {
    const perfectCoverage = {
        lines: { total: 100, covered: 100, skipped: 0, pct: 100 },
        statements: { total: 100, covered: 100, skipped: 0, pct: 100 },
        functions: { total: 100, covered: 100, skipped: 0, pct: 100 },
        branches: { total: 100, covered: 100, skipped: 0, pct: 100 }
    };

    it('should return false for perfect coverage', () => {
        expect(isBelowThreshold(perfectCoverage)).toBe(false);
    });

    it('should return false for coverage exactly at thresholds', () => {
        const atThreshold = {
            statements: { ...perfectCoverage.statements, pct: THRESHOLDS.statements },
            branches: { ...perfectCoverage.branches, pct: THRESHOLDS.branches },
            functions: { ...perfectCoverage.functions, pct: THRESHOLDS.functions },
            lines: { ...perfectCoverage.lines, pct: THRESHOLDS.lines }
        };
        expect(isBelowThreshold(atThreshold)).toBe(false);
    });

    it('should return true if statements are below threshold', () => {
        const low = { ...perfectCoverage, statements: { ...perfectCoverage.statements, pct: THRESHOLDS.statements - 0.01 } };
        expect(isBelowThreshold(low)).toBe(true);
    });

    it('should return true if branches are below threshold', () => {
        const low = { ...perfectCoverage, branches: { ...perfectCoverage.branches, pct: THRESHOLDS.branches - 0.01 } };
        expect(isBelowThreshold(low)).toBe(true);
    });

    it('should return true if functions are below threshold', () => {
        const low = { ...perfectCoverage, functions: { ...perfectCoverage.functions, pct: THRESHOLDS.functions - 0.01 } };
        expect(isBelowThreshold(low)).toBe(true);
    });

    it('should return true if lines are below threshold', () => {
        const low = { ...perfectCoverage, lines: { ...perfectCoverage.lines, pct: THRESHOLDS.lines - 0.01 } };
        expect(isBelowThreshold(low)).toBe(true);
    });
});
