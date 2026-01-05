import type Phaser from 'phaser';
import type { Drive } from './drives/types';

/**
 * Enum defining all available ship module types
 */
export enum ModuleType {
    DRIVE = 'drive',
    LASER = 'laser',
    ROCKET = 'rocket',
    ARMOR = 'armor',
    SHIELD = 'shield'
}

/**
 * Base module interface shared by all ship modules (weapons, drives, etc.)
 */
export interface ShipModule {
    readonly type: ModuleType;
    createTexture?(scene: Phaser.Scene): void;
    visibleOnMount?: boolean;
    mountTextureKey?: string;
    TEXTURE_KEY?: string;
    scale?: number;
    addMountEffect?(scene: Phaser.Scene, sprite: Phaser.GameObjects.Image): void;
}

/**
 * Weapon-specific module interface
 */
export interface WeaponModule extends ShipModule {
    readonly type: ModuleType.LASER | ModuleType.ROCKET;
    fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        category: number,
        collidesWith: number,
        shipVelocity?: { x: number; y: number }
    ): Phaser.Physics.Matter.Image | undefined;
    recoil?: number;
    reloadTime?: number;
    currentAmmo?: number;
    maxAmmo?: number;
    firingDelay?: { min: number; max: number };
    fixedFireDirection?: boolean;
}

/**
 * Helper to get module type safely
 */
export function getModuleType(module: ShipModule): ModuleType {
    return module.type;
}

/**
 * Type guard to check if a module is a weapon (has fire method)
 */
export function isWeapon(module: ShipModule): module is WeaponModule {
    return module.type === ModuleType.LASER || module.type === ModuleType.ROCKET;
}

/**
 * Type guard to check if a module is a drive (has thrust property)
 */
export function isDrive(module: ShipModule): module is Drive {
    return module.type === ModuleType.DRIVE;
}
