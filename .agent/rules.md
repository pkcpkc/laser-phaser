# Agent Rules

## Code Quality Standards

### Testing
- **ALWAYS write tests** when creating new code
- **ALWAYS update tests** when modifying existing code
- **ALWAYS run tests** after writing/updating them (`npm test`)
- **ALWAYS fix failing tests** before considering work complete
- Use `vitest` for all testing
- Place tests in `tests/` directory mirroring source structure
- Export functions from source files when needed for testing

### Linting
- **ALWAYS fix linting errors** before completing any code changes
- Run linter to verify code quality
- Address all linting issues, don't ignore them

### Workflow
1. Write/modify code
2. Write/update corresponding tests
3. Run tests (`npm test`)
4. Fix any failing tests
5. Fix any linting errors
6. Verify all checks pass before completion
