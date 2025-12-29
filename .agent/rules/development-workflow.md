---
trigger: always_on
---

# Development Workflow

1. **Cleanup & Prep**
   - Delete all unused code, dead imports, and obsolete test files.

2. **Implementation**
   - Write or modify the code.
   - Write or update corresponding tests (ensure complete coverage).

3. **Validation Loop**
   - Fix all linting errors: `npx tsc --noEmit`
   - Run tests: `npm test`
   - Fix any failing tests immediately.
   - Run build: `npm run build` to check for build errors.

4. **Problem Check**
   - After each task, check `@current_problems` (IDE/linter diagnostics).
   - If any problems exist, fix them before proceeding.

5. **Completion**
   - Verify all checks pass (Lint, Test, Build).
   - Update README.md with any relevant changes.