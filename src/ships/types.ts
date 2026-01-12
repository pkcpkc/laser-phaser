import type { Laser } from './modules/lasers/types';
import type { IShip } from '../di/interfaces/ship';
import type { ShipEffect } from './effects/types';

export interface ShipPhysicsConfig {
    mass?: number;
    massRange?: { min: number; max: number };
    frictionAir?: number;
    fixedRotation?: boolean;
    initialAngle?: number;
}

export interface ShipGameplayConfig {
    health: number;
    speed?: number;
    thrust?: number;
    rotationSpeed?: number;
}

export interface ModulePoint {
    x: number;
    y: number;
    angle?: number; // relative angle in radians, 0 is forward
}

export type { ExplosionConfig } from './effects/explosion';
import type { ExplosionConfig } from './effects/explosion';

export interface ShipMarker {
    type: string;
    x: number;
    y: number;
    angle: number;
}

export const LootType = {
    SILVER: '🪙',
    GOLD: '🌕',
    GEM: '💎',
    MODULE: '📦'
} as const;

export type LootType = typeof LootType[keyof typeof LootType];

export interface LootItem {
    type: LootType;
    dropChance: number; // 0-1
}

export type LootConfig = LootItem[];



/**
 * Static definition of a ship's chassis/hull.
 * Defines what options are AVAILABLE.
 */
export interface ShipDefinition {
    id: string;
    assetKey: string;
    assetPath: string;
    physics: ShipPhysicsConfig;
    gameplay: ShipGameplayConfig;
    explosion?: ExplosionConfig;
    markers: ShipMarker[];
    frame?: string;
    createTextures?: (scene: Phaser.Scene) => void;
    createEffect?: (scene: Phaser.Scene, ship: IShip) => ShipEffect;
    randomizeAssetKey?: (scene: Phaser.Scene) => string;
}

/**
 * Configuration for a specific instance of a ship type.
 * Combines the static definition with a specific loadout.
 */
import type { Drive } from './modules/drives/types';

export interface ShipConfig {
    definition: ShipDefinition;
    modules: {
        marker: ShipMarker;
        module: new () => Laser | Drive;
    }[];
    loot?: LootConfig;
}

export interface ShipCollisionConfig {
    category: number;
    collidesWith: number;
    laserCategory: number;
    laserCollidesWith: number;
    lootCategory?: number;
    lootCollidesWith?: number;
    isEnemy?: boolean; // Enemy ships have unlimited ammo
    hasUnlimitedAmmo?: boolean; // If true, ammo checks are skipped (useful for debug/god mode)
}
