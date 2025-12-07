import { Ship, type ShipCollisionConfig } from './ship';
import { BloodHunterDefinition } from './definitions/blood-hunter';
import { BloodHunter2L } from './configurations/blood-hunter-2l';

export class BloodHunter extends Ship {
    static assetKey = BloodHunterDefinition.assetKey;
    static assetPath = BloodHunterDefinition.assetPath;

    constructor(scene: Phaser.Scene, x: number, y: number, collisionConfig: ShipCollisionConfig) {
        super(scene, x, y, BloodHunter2L, collisionConfig);
    }
}
