import type { Ship, ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';

export interface BaseEnemyData {
    ship: Ship;
    spawnTime: number;
    startX?: number;
    startY?: number;
    [key: string]: unknown;
}

export interface IFormationConstructor {
    new(scene: Phaser.Scene, shipClass: unknown, collisionConfig: ShipCollisionConfig, config?: Record<string, unknown>, shipConfigs?: ShipConfig[]): IFormation;
}

export interface IFormation {
    spawn(): void;
    getShips(): BaseEnemyData[];
    isComplete(): boolean;
    destroy(): void;
    update(time: number, delta: number): void;
}
