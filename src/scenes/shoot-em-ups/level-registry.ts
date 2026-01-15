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

/** Level registry - auto-discovers all level files using Vite's import.meta.glob */

const levelModules = import.meta.glob<{ [key: string]: LevelConfig }>(
    './levels/**/*-level.ts',
    { eager: true }
);


const levels: Record<string, LevelEntry> = {};

for (const path in levelModules) {
    const module = levelModules[path];

    // Extract level ID from filename: ./levels/blood-hunters-level.ts -> blood-hunters-level
    // Also handles subdirectories: ./levels/debug/ship-debug-level.ts -> ship-debug-level
    const match = path.match(/\/([^/]+)\.ts$/);
    if (!match) continue;

    const levelId = match[1];


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
