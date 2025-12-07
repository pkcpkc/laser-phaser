import { Ship, type ShipCollisionConfig } from './ship';
import { BigCruiserDefinition } from './definitions/big-cruiser';
import { BigCruiser1L } from './configurations/big-cruiser-1l';

export class BigCruiser extends Ship {
    static assetKey = BigCruiserDefinition.assetKey;
    static assetPath = BigCruiserDefinition.assetPath;
    static gameplay = BigCruiserDefinition.gameplay;

    constructor(scene: Phaser.Scene, x: number, y: number, collisionConfig: ShipCollisionConfig) {
        super(scene, x, y, BigCruiser1L, collisionConfig);
    }
}
