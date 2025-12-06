import { Ship, type ShipConfig, type ShipCollisionConfig } from './ship';
import { RedLaser } from './mounts/lasers/red-laser';
import { markers } from '../generated/blood-hunter';

const BloodHunterConfig: ShipConfig = {
    id: 'blood-hunter',
    assetKey: 'blood-hunter',
    assetPath: 'assets/ships/blood-hunter.png',
    markers: markers,
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
    },
    loot: {
        text: '🪙',
        dropChance: 1,
        lifespan: 3000,
        type: 'silver',
        value: 1
    }
};

export class BloodHunter extends Ship {
    static assetKey = BloodHunterConfig.assetKey;
    static assetPath = BloodHunterConfig.assetPath;

    constructor(scene: Phaser.Scene, x: number, y: number, collisionConfig: ShipCollisionConfig) {
        super(scene, x, y, BloodHunterConfig, collisionConfig);
    }
}
