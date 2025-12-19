# Agent Rules

## Code Quality Standards

### Testing
- **ALWAYS write tests** when creating new code
- **ALWAYS update tests** when modifying existing code
- **ALWAYS run tests** after writing/updating them (`npm test`)
- **ALWAYS fix failing tests** before considering work complete
- **ALWAYS fix linting errors** before considering work complete
- Use `vitest` for all testing
- Place tests in `tests/` directory mirroring source structure
- Export functions from source files when needed for testing

### Linting
- **ALWAYS fix linting errors** before completing any code changes
- Run linter to verify code quality
- Address all linting issues, don't ignore them

### Workflow
1. **Delete all unused code and tests** - Remove dead code, unused imports, and obsolete test files
2. Write/modify code
3. Write/update corresponding tests - Cover everything with tests
4. **Fix any linting errors** (`npx tsc --noEmit`)
5. Run tests (`npm test`)
6. Fix any failing tests
7. Run build and fix build errors (`npm run build`)
8. Verify all checks pass before completion
9. **Update README.md** with any relevant changes
