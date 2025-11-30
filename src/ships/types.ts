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

export interface ShipMountConfig {
    primary: new () => Laser;
}

export type { ExplosionConfig } from './effects/explosion';
import type { ExplosionConfig } from './effects/explosion';

export interface ShipConfig {
    id: string;
    assetKey: string;
    assetPath: string;
    markerPath: string;
    physics: ShipPhysicsConfig;
    gameplay: ShipGameplayConfig;
    mounts?: ShipMountConfig;
    explosion?: ExplosionConfig;
}

export interface ShipCollisionConfig {
    category: number;
    collidesWith: number;
    laserCategory: number;
    laserCollidesWith: number;
}
