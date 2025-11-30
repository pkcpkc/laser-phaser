import { Ship, type ShipConfig, type ShipCollisionConfig } from './ship';
import { WhiteLaser } from './mounts/lasers/white-laser';

const BigCruiserConfig: ShipConfig = {
    id: 'big-cruiser',
    assetKey: 'big-cruiser',
    assetPath: 'res/ships/big-cruiser.png',
    markerPath: 'res/ships/big-cruiser.marker.json',
    physics: {
        mass: 30,
        frictionAir: 0.05,
        fixedRotation: true,
        initialAngle: -90
    },
    gameplay: {
        health: 100,
        thrust: 0.1,
        rotationSpeed: 0
    },
    mounts: {
        primary: WhiteLaser
    }
};

export class BigCruiser extends Ship {
    static assetKey = BigCruiserConfig.assetKey;
    static assetPath = BigCruiserConfig.assetPath;
    static gameplay = BigCruiserConfig.gameplay;

    constructor(scene: Phaser.Scene, x: number, y: number, collisionConfig: ShipCollisionConfig) {
        super(scene, x, y, BigCruiserConfig, collisionConfig);
    }
}
