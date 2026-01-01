---
trigger: always_on
---

# Development Workflow

1. **Context Analysis**
   - Check `README.md` to get an overview before starting the planning.

2. **Implementation**
   - Write or modify the code.
   - Write or update corresponding tests (ensure complete coverage).

3. **Cleanup**
   - Delete all unused code, dead imports, and obsolete test files.
   - Drop backward compatibility.

4. **Validation Loop**
   - Fix all linting errors: `npx tsc --noEmit`
   - Check tests: `npm run test:check`
   - Run tests: `npm test`
   - When running specific test files, ALWAYS use `npx vitest run path/to/file.test.ts` (never just `vitest`) to avoid watch mode.
   - Fix any failing tests immediately.
   - Run build: `npm run build` to check for build errors.

5. **Problem Check**
   - After each task, check `@current_problems` (IDE/linter diagnostics).
   - If any problems exist, fix them before proceeding.

6. **Debugging**
   - Check `@terminal:node` for runtime logs and error messages.
   - Use console output to understand application state and flow.
   - Correlate terminal logs with IDE diagnostics for full context.

7. **Completion**
   - Verify all checks pass (Lint, Test, Build).
   - Update README.md with any relevant changes.