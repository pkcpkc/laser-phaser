import Phaser from 'phaser';
import type { ShipConfig } from '../../ships/types';
import type { ShipEffect } from '../../ships/effects/types';

export interface IShip {
    readonly sprite: Phaser.Physics.Matter.Image;
    readonly config: ShipConfig;
    currentHealth: number;
    takeDamage(amount: number): void;
    explode(): void;
    fireLasers(): void;
    setEffect(effect: ShipEffect): void;
    destroy(): void;
    mass: number;
    acceleration: number;
    maxSpeed: number;
}

export interface IModuleManager {
    fireLasers(): void;
    destroy(): void;
    getActiveModules(): any[];
}
