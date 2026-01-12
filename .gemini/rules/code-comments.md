# Code Comments Policy

## Keep Only Relevant Comments
- **JSDoc comments**: Keep for public APIs, classes, and complex functions
- **Inline comments explaining WHY**: Keep when logic is non-obvious
- **Delete immediately**:
  - Comments describing WHAT code does (code should be self-documenting)
  - Outdated/stale comments that no longer match the code
  - Commented-out code blocks (use version control instead)
  - Stream-of-consciousness notes, debugging thoughts, or implementation journals
  - "TODO" or "FIXME" without actionable context
  - Comments marking "Deprecated" code (delete the code instead)

## When in Doubt, Delete
If a comment's value is uncertain, remove it. Good code reads clearly without comments.

## Acceptable Comment Patterns
```typescript
// Good: Explains WHY
// Matter.js requires frictionAir=0 for constant velocity movement

// Good: JSDoc for public API
/** Fires the weapon and returns the projectile. */

// Bad: Describes WHAT (delete)
// Loop through enemies

// Bad: Journal entry (delete)
// Actually, the previous implementation redrew every frame effectively? No...
```
