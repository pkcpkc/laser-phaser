import { Ship, type ShipCollisionConfig } from './ship';
import { BloodFighterDefinition } from './definitions/blood-fighter';
import { BloodFighter2L } from './configurations/blood-fighter-2l';

export class BloodFighter extends Ship {
    static assetKey = BloodFighterDefinition.assetKey;
    static assetPath = BloodFighterDefinition.assetPath;

    constructor(scene: Phaser.Scene, x: number, y: number, collisionConfig: ShipCollisionConfig) {
        super(scene, x, y, BloodFighter2L, collisionConfig);
    }
}
