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
        speed: 200,
        thrust: 0.2,
        rotationSpeed: 0.05
    },
    mounts: {
        primary: WhiteLaser
    },
    explosion: {
        frame: 'white', // Assuming blue flare exists, otherwise fallback or use red
        speed: { min: 50, max: 200 },
        scale: { start: 0.6, end: 0 },
        lifespan: 800,
        blendMode: 'ADD'
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
