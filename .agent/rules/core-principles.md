# Core Principles

## Testing & Quality
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

## Design Patterns
- **DRY (Don't Repeat Yourself)**:
  - Avoid code duplication. Reuse logic via functions/classes.
- **SOLID**:
  - Adhere to SOLID principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion).
