import Phaser from 'phaser';
import type { Drive } from './drives/types';

/**
 * Base module interface shared by all ship modules (weapons, drives, etc.)
 */
export interface ShipModule {
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
 * Type guard to check if a module is a weapon (has fire method)
 */
export function isWeapon(module: ShipModule): module is WeaponModule {
    return typeof (module as WeaponModule).fire === 'function';
}

/**
 * Type guard to check if a module is a drive (has thrust property)
 */
export function isDrive(module: ShipModule): module is Drive {
    return 'thrust' in module;
}
