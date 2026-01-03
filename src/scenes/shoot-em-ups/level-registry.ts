import type { LevelConfig } from './levels/level';

/**
 * Level registry - auto-discovers all level files in the levels folder
 * Uses Vite's import.meta.glob for build-time discovery
 */

export interface LevelEntry {
    sceneKey: string;
    levelConfig: LevelConfig;
    defaultColor?: string;
    backgroundTexture?: string;
}

// Auto-import all level modules (excluding level.ts which is the base class)
// Vite's import.meta.glob with eager: true loads all modules at build time
const levelModules = import.meta.glob<{ [key: string]: LevelConfig }>(
    './levels/*-level.ts',
    { eager: true }
);

// Build the registry dynamically from discovered modules
const levels: Record<string, LevelEntry> = {};

for (const path in levelModules) {
    const module = levelModules[path];

    // Extract level ID from filename: ./levels/blood-hunters-level.ts -> blood-hunters-level
    const match = path.match(/\.\/levels\/(.+)\.ts$/);
    if (!match) continue;

    const levelId = match[1];

    // Find the exported LevelConfig (first export that has a 'name' property)
    for (const exportName in module) {
        const exported = module[exportName];
        if (exported && typeof exported === 'object' && 'name' in exported && 'formations' in exported) {
            levels[levelId] = {
                sceneKey: 'ShootEmUpScene',
                levelConfig: exported as LevelConfig,
                defaultColor: '#ffff00',
                backgroundTexture: 'blood_nebula'
            };
            console.log(`Registered level: ${levelId}`);
            break;
        }
    }
}

export function getLevel(levelId: string): LevelEntry | undefined {
    return levels[levelId];
}

export function getLevelConfig(levelId: string): LevelConfig | undefined {
    return levels[levelId]?.levelConfig;
}

export function getAllLevelIds(): string[] {
    return Object.keys(levels);
}
