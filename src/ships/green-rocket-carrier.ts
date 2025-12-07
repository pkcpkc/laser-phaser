import { Ship, type ShipCollisionConfig } from './ship';
import { GreenRocketCarrierDefinition } from './definitions/green-rocket-carrier';
import { GreenRocketCarrier2R } from './configurations/green-rocket-carrier-2r';

export class GreenRocketCarrier extends Ship {
    static assetKey = GreenRocketCarrierDefinition.assetKey;
    static assetPath = GreenRocketCarrierDefinition.assetPath;
    static gameplay = GreenRocketCarrierDefinition.gameplay;

    constructor(scene: Phaser.Scene, x: number, y: number, collisionConfig: ShipCollisionConfig) {
        super(scene, x, y, GreenRocketCarrier2R, collisionConfig);
    }
}
