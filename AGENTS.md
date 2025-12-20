# Agent Rules

## Core Principles

### Testing & Quality
- **Mandatory Testing**:
  - **ALWAYS** write tests for new code.
  - **ALWAYS** update tests for modified code.
  - **ALWAYS** run tests (`npm test`) after changes.
  - **ALWAYS** fix failing tests before moving on.
- **Strict Linting**:
  - **ALWAYS** fix linting errors (`npx tsc --noEmit`) before completing work.
  - Never ignore lint issues.
- **Architecture**:
  - Use `vitest` for all testing.
  - **ALWAYS** execute vitest as `vitest run path/to/file.test.ts ...`.
    - Avoid `vitest` without `run` as it defaults to watch mode (blocks execution).
  - Place tests in `tests/` directory, mirroring the source structure.
  - Export functions from source files when necessary for testing.
- **File Naming**:
  - **ALWAYS** use `kebab-case` for all filenames (e.g., `solar-flare-effect.ts` not `SolarFlareEffect.ts`).
  - **ALWAYS** use `kebab-case` for directories.

## Development Workflow

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

4. **Completion**
   - Verify all checks pass (Lint, Test, Build).
   - Update `README.md` with any relevant changes.
