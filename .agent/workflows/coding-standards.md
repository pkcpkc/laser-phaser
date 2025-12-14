---
description: Coding standards and quality requirements
---

# Coding Standards

## Before Completing Any Work

1. **Delete all unused code and tests** - Remove dead code, unused imports, and obsolete test files
2. **Cover everything with tests** - Write comprehensive tests for all new and modified code
3. **Run and fix tests** - Execute `npm test` and fix any failures
4. **Update README** - Keep documentation in sync with changes

---

Before completing any code changes, ensure you follow the rules in `.agent/rules.md`:

## Required Steps

1. **Write/update tests** for all code changes and new code
   - Place tests in `tests/` directory mirroring source structure
   - Use `vitest` for all testing
   - Export functions from source files when needed for testing
   - Ensure code coverage of 70-80%

2. **Fix all linting errors** BEFORE running tests
   ```bash
   npx tsc --noEmit
   ```

3. **Run tests** after fixing linting errors
   ```bash
   npm test
   ```

4. **Fix any failing tests** before considering work complete

5. **Verify all checks pass** before marking work as done

6. **Update README.md** to reflect any changes made to the project (features, usage, configuration, etc.)

## Testing Workflow

- New features → create new test file
- Code modifications → update existing tests
- Always run `npm test` to verify
- Never skip test failures

## Linting

- **ALWAYS fix linting errors BEFORE running tests**
- Run TypeScript compiler to check for errors:
  ```bash
  npx tsc --noEmit
  ```
- Address all linting issues immediately
- Don't ignore or suppress linting errors
- Fix root causes, not symptoms

## Clean Code

### General
- **Avoid Code Duplication**: DRY (Don't Repeat Yourself). Refactor common logic into reusable functions or classes.
- **KISS**: Keep It Simple, Stupid. Avoid over-engineering.
- **YAGNI**: You Aren't Gonna Need It. Don't implement features "just in case".
- **Single Responsibility**: Classes and functions should do one thing and do it well.

### Naming
- **Meaningful Names**: Use descriptive names for variables, functions, and classes.
  - Bad: `const x = 5;`
  - Good: `const retryCount = 5;`
- **Consistent Naming**: Follow project conventions (camelCase for vars/funcs, PascalCase for Classes).
- **No Magic Numbers**: Use named constants for literal values.
  - Bad: `if (status === 2) ...`
  - Good: `if (status === STATUS_COMPLETED) ...`

### Functions
- **Small functions**: Functions should be small and focused.
- **Limit Arguments**: Try to limit function arguments to 3 or fewer. Use config objects for more.
- **Pure Functions**: Prefer pure functions (output determined only by input, no side effects) where possible.

### Maintainability
- **Remove Dead Code**: Delete unused variables, functions, imports, and commented-out code.
- **Comments**: Write self-documenting code. Use comments only for complex logic or "why", not "what".
- **Early Returns**: Use early returns to reduce nesting indentation.

### Dependencies
- **Explicit Imports**: Don't rely on global state or implicit dependencies.
- **Modularization**: Keep modules loosely coupled.

### TypeScript Specific
- **No `any`**: Avoid `any` at all costs. Use `unknown` if type is truly not known, or generic types.
- **Strict Typing**: Enable and ensure `strict: true` in `tsconfig.json`.
- **Interfaces vs Types**: Use `interface` for defining object shapes (extensible), and `type` for unions, intersections, or primitives.
- **Explicit Return Types**: explicit return types for all public methods and functions.
- **No Non-Null Assertion**: Avoid `!`. Use optional chaining `?.` or nullish coalescing `??`.