import type { ShipDefinition, ShipMarker } from '../types';
import { createAsteroidTexture } from './asteroid-small';

const mediumMarker: ShipMarker = {
    type: 'drive',
    x: 12, // Rear position
    y: 24, // Center position
    angle: 0
};

export const MediumAsteroidDefinition: ShipDefinition = {
    id: 'asteroid-medium',
    assetKey: 'asteroid-medium-texture',
    assetPath: '',
    markers: [mediumMarker],
    physics: {
        frictionAir: 0,
        fixedRotation: false,
        mass: 8.5
    },
    gameplay: {
        health: 2,
        speed: 1.2,
        thrust: 12
    },
    explosion: {
        type: 'dust',
        lifespan: 2200,
        scale: { start: 2.0, end: 0.5 },
        speed: { min: 10, max: 30 },
        color: 0x2C2C2C, // Dark Granite
        particleCount: 25
    }
};

export function generateMediumAsteroidTexture(scene: Phaser.Scene): void {
    for (let i = 0; i < 5; i++) {
        createAsteroidTexture(scene, `asteroid-medium-texture-${i}`, 20, { // Reduced radius 25 -> 20
            fill: 0x2C2C2C,      // Dark Granite
            stroke: 0x252525,
            fissure: 0x151515,   // Deep Dark
            highlight: 0x454545  // Grey Highlight
        });
    }
}
