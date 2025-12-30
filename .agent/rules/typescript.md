# TypeScript Guidelines

## 1. Safety & Strictness
- **No `any`**:
  - **Prohibited**: Do not use `any`. It defeats the purpose of TypeScript.
  - **Alternative**: Use `unknown` if the type is truly not known yet, and narrow it before use.
  - **Refactoring**: If you see `any` in existing code, prioritize typing it correctly.
- **Strict Null Checks**:
  - Assume values can be `null` or `undefined` unless typed otherwise.
  - Use **Optional Chaining** (`foo?.bar`) and **Nullish Coalescing** (`foo ?? default`) instead of verbose checks.
- **Explicit Return Types**:
  - Always define the return type for:
    - Exported functions.
    - Public/private methods in classes.
    - Complex internal functions where inference might be ambiguous.

## 2. Type Definitions
- **Interfaces vs Types**:
  - Use **Interfaces** for object shapes, class implementations, and extendable structures.
    - `interface ShipConfig { speed: number; }`
  - Use **Types** for unions, intersections, primitives, and complex utility mappings.
    - `type Direction = 'up' | 'down';`
- **Immutability**:
  - Prefer `readonly` properties for config objects and state that shouldn't change.
  - Use `readonly T[]` or `ReadonlyArray<T>` for lists passed as arguments to prevent accidental mutation.

## 3. Clean Code & Patterns
- **No Enums**:
  - Avoid TypeScript `enum`. They add runtime code and strict nominal typing issues.
  - **Preferred**: Use String Union Types or Const Objects.
    - `type State = 'LOADING' | 'READY';`
    - `const SCENES = { GAME: 'GameScene' } as const;`
- **Magic Strings & Numbers**:
  - Extract all magic values into `const` variables or configuration objects (e.g., `const MAX_SPEED = 500;`).
- **Utility Types**:
  - Don't duplicate types. Use standard utilities:
    - `Partial<T>`: Make all props optional.
    - `Pick<T, K>` / `Omit<T, K>`: Select subsets of keys.
    - `Record<K, T>`: For dictionaries/maps.
- **Type Guards**:
  - Use user-defined type guards for narrowing generic types or unknown inputs.
    - `function isShip(obj: unknown): obj is Ship { ... }`

## 4. Async Handling
- **Async/Await**:
  - Always prefer `async/await` over raw `.then()` chains for readability.
  - Ensure all Promises are handled (awaited or explicitly caught).

## 5. Naming
- **PascalCase**: Classes, Interfaces, Types, Enums.
- **camelCase**: Variables, Functions, Methods, Properties.
- **UPPER_CASE**: Global constants, static readonly config values.

## 6. Testing
- **Test File Naming**:
  - Test files must follow the naming of their source file, with `.test.ts` appended.
  - Example: `base-laser.ts` → `base-laser.test.ts`

## 7. Structure & Imports
- **No Barrel Files**:
  - Do not create `index.ts` files that re-export other modules.
  - Use explicit imports pointing to the specific file.
  - Reason: Prevents circular dependency issues and improves navigation.
