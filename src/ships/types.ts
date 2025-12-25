import type { Laser } from './mounts/lasers/types';

export interface ShipPhysicsConfig {
    mass?: number;
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

export interface MountPoint {
    x: number;
    y: number;
    angle?: number; // relative angle in radians, 0 is forward
}

// Deprecated: Old way of assigning primary laser
export interface ShipMountConfig {
    primary: new () => Laser;
}

export type { ExplosionConfig } from './effects/explosion';
import type { ExplosionConfig } from './effects/explosion';

export interface ShipMarker {
    type: string;
    x: number;
    y: number;
    angle: number;
}

export interface LootConfig {
    text: string;
    dropChance?: number; // 0-1, default 1
    lifespan?: number; // ms, default 3000
    value?: number;
    type?: 'gold' | 'silver' | 'gem' | 'mount';
}

// --- New Architecture ---

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
    // All possible markers on this hull
    markers: ShipMarker[];
    frame?: string;
}

/**
 * Configuration for a specific instance of a ship type.
 * Combines the static definition with a specific loadout.
 */
export interface ShipConfig {
    definition: ShipDefinition;
    mounts: {
        marker: ShipMarker;
        weapon: new () => Laser;
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
}
