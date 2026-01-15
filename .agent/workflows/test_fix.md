---
description: Run test:check and coverage, add missing tests, fix failing tests
---

1. **Run Test Check**:
   // turbo
   - Run `npm run test:sync` to identify files missing test coverage.
   - Note all files listed that need tests.

2. **Run Tests with Coverage**:
   // turbo
   - Run `npm run test:coverage` to get a coverage report.
   - It's crucial to wait unless the "Coverage report" appears!
   - Identify files with no or low coverage.
   - **Important**: Aim for sensible test coverage. Do not enforce 100% coverage if it does not make sense (e.g., simple configs, standard boilerplate, or trivial code). Focus on covering significant logic and likely failure points.
   - Pragmatic Coverage: Statements: 80%, Branches: 70%, Functions: 90%, Lines: 80%

3. **Analyze Missing Tests**:
   - Cross-reference `test:check` output with coverage report.
   - Prioritize files that:
     - Have no corresponding test file.
     - Have significant logic (not just type exports or simple configs).
     - Are in `src/` but not `src/generated/`.

4. **Create Missing Tests**:
   - For each file needing tests, create `tests/unit/[path]/[filename].test.ts`.
   - Follow existing test patterns in the codebase.
   - Focus on:
     - Public API methods.
     - Edge cases and error handling.
     - Integration with Phaser mocks where needed.

5. **Run All Tests**:
   // turbo
   - Run `npm test` to verify all tests pass.
   - If tests fail, proceed to step 6.

6. **Fix Failing Tests**:
   - Analyze each failure.
   - Fix either the test or the source code as appropriate.
   - Re-run tests after each fix.

7. **Validate**:
   // turbo
   - Run `npx tsc --noEmit` to ensure no type errors.
   // turbo
   - Run `npm run test:check` to confirm all required tests exist.
   // turbo
   - Run `npm test` to confirm all tests pass.

8. **Cleanup**:
   - Delete any generated log files (e.g., `test_output.txt`).
   - Verify no console.log statements left in tests.