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

export interface ShipConfig {
    id: string;
    assetKey: string;
    assetPath: string;
    markers?: ShipMarker[];
    physics: ShipPhysicsConfig;
    gameplay: ShipGameplayConfig;
    mountPoints?: MountPoint[];
    mounts?: ShipMountConfig;
    explosion?: ExplosionConfig;
    loot?: LootConfig;
}

export interface ShipCollisionConfig {
    category: number;
    collidesWith: number;
    laserCategory: number;
    laserCollidesWith: number;
    lootCategory?: number;
    lootCollidesWith?: number;
}
