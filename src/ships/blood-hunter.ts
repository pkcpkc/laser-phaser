import { Ship, type ShipConfig, type ShipCollisionConfig } from './ship';
import { RedLaser } from './mounts/lasers/red-laser';

const BloodHunterConfig: ShipConfig = {
    id: 'blood-hunter',
    assetKey: 'blood-hunter',
    assetPath: 'res/ships/blood-hunter.png',
    markerPath: 'res/ships/blood-hunter.marker.json',
    physics: {
        frictionAir: 0,
        fixedRotation: true,
        initialAngle: 90
    },
    gameplay: {
        health: 3,
        speed: 2,
        rotationSpeed: 0.1
    },
    explosion: {
        frame: 'red',
        speed: { min: 50, max: 150 },
        scale: { start: 0.4, end: 0 },
        lifespan: 500,
        blendMode: 'ADD'
    },
    mounts: {
        primary: RedLaser
    }
};

export class BloodHunter extends Ship {
    static assetKey = BloodHunterConfig.assetKey;
    static assetPath = BloodHunterConfig.assetPath;

    constructor(scene: Phaser.Scene, x: number, y: number, collisionConfig: ShipCollisionConfig) {
        super(scene, x, y, BloodHunterConfig, collisionConfig);
    }
}
