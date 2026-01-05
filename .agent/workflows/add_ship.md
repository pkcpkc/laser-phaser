---
description: Create a new ship from an existing asset
---

1.  **Identify Ship Name**: The user should provide a ship name (e.g., "firefly-red"). If not provided, ask for it. Let's refer to this as `[SHIP_ID]` (kebab-case).
2.  **Verify Asset**: Check if `res/ships/[SHIP_ID].png` exists. If not, ask the user to provide the asset or place it there, then stop or wait.
3.  **Generate Markers & Atlases**:
    *   Run `npm run build:markers`.
    *   Run `npm run build:atlases`.
4.  **Analyze Ship & Determine Stats**:
    *   **Estimate Mass & Health** based on `[SHIP_ID]` keywords:
        *   If `boss`: Mass ~25, Health ~100.
        *   If `carrier` or `heavy`: Mass ~20, Health ~60.
        *   If `fighter`: Mass ~10, Health ~10.
        *   Default: Mass 5, Health 20.
    *   **Estimate Rotation Speed**:
        *   Heavier ships rotate slower (e.g., Boss: 0.03).
        *   Lighter ships rotate faster (e.g., Fighter: 0.08).

5.  **Create Definition**:
    *   Create a file `src/ships/definitions/[SHIP_ID].ts`.
    *   Use values determined above in the template:
        ```typescript
        import type { ShipDefinition } from '../types';
        import { markers } from '../../../src-generated/ships/markers/[SHIP_ID].markers';

        export const [SHIP_VAR_NAME]Definition: ShipDefinition = {
            id: '[SHIP_ID]',
            assetKey: 'ships',
            frame: '[SHIP_ID]',
            assetPath: 'assets/ships/[SHIP_ID].png',
            markers: markers,
            physics: {
                mass: [MASS],
                frictionAir: 0.05,
                fixedRotation: false
            },
            gameplay: {
                health: [HEALTH],
                rotationSpeed: [ROTATION_SPEED]
            }
        };
        ```

6.  **Determine Equipment (Generic Matching)**:
    *   **Goal**: Find the best matching module for each slot type (Laser, Drive, Rocket) by checking available files in `src/ships/modules/`.
    *   **Algorithm**:
        For each Module Type (`lasers`, `drives`, `rockets`, `prominently armor`, `shields`):
        1.  List all files in `src/ships/modules/[type]/`.
        2.  For each file, calculate a match score against `[SHIP_ID]`:
            *   Does the filename share words with `[SHIP_ID]`? (e.g., `blood-rocket` matches `blood-bomber` on "blood").
            *   Prioritize exact color matches or specific role matches.
        3.  Select the file with the highest score.
        4.  **Fallback**: If no match found, use defaults:
            *   Laser: `RedLaser`
            *   Drive: `IonDrive`
            *   Rocket: `GreenRocket`
            *   Armor: `StandardArmor` (if implemented)
            *   Shield: `StandardShield` (if implemented)

7.  **Create Configuration**:
    *   Create a file `src/ships/configurations/[SHIP_ID]-config.ts`.
    *   Import the selected modules.
    *   Use the template:
        ```typescript
        import type { ShipConfig } from '../types';
        import { ModuleType } from '../modules/module-types';
        import { [SHIP_VAR_NAME]Definition } from '../definitions/[SHIP_ID]';
        // Imports for [LASER_CLASS], [DRIVE_CLASS], [ROCKET_CLASS], [ARMOR_CLASS], [SHIELD_CLASS]...

        export const [SHIP_VAR_NAME]Config: ShipConfig = {
            definition: [SHIP_VAR_NAME]Definition,
            modules: [
                ...[SHIP_VAR_NAME]Definition.markers
                    .filter(m => m.type === ModuleType.LASER)
                    .map(m => ({ marker: m, module: [LASER_CLASS] })),
                ...[SHIP_VAR_NAME]Definition.markers
                    .filter(m => m.type === ModuleType.DRIVE)
                    .map(m => ({ marker: m, module: [DRIVE_CLASS] })),
                ...[SHIP_VAR_NAME]Definition.markers
                    .filter(m => m.type === ModuleType.ROCKET)
                    .map(m => ({ marker: m, module: [ROCKET_CLASS] })),
                ...[SHIP_VAR_NAME]Definition.markers
                    .filter(m => m.type === ModuleType.ARMOR)
                    .map(m => ({ marker: m, module: [ARMOR_CLASS] })),
                ...[SHIP_VAR_NAME]Definition.markers
                    .filter(m => m.type === ModuleType.SHIELD)
                    .map(m => ({ marker: m, module: [SHIELD_CLASS] }))
            ],
            loot: []
        };
        ```

8.  **Notify User**: Confirm creation and list the auto-detected stats and equipment.
