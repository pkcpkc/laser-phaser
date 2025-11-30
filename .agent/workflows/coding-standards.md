---
description: Coding standards and quality requirements
---

# Coding Standards

Before completing any code changes, ensure you follow the rules in `.agent/rules.md`:

## Required Steps

1. **Write/update tests** for all code changes
   - Place tests in `tests/` directory mirroring source structure
   - Use `vitest` for all testing
   - Export functions from source files when needed for testing

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
