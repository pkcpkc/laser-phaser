import type { ShipDefinition, ShipMarker } from '../types';
import { AsteroidTexture } from '../textures/asteroid-texture';

const largeMarker: ShipMarker = {
    type: 'drive',
    x: 18, // Rear position
    y: 36, // Center position
    angle: 0
};

export const LargeAsteroidDefinition: ShipDefinition = {
    id: 'asteroid-large',
    assetKey: 'asteroid-large-texture',
    assetPath: '',
    markers: [largeMarker],
    physics: {
        frictionAir: 0.05,
        fixedRotation: false,
        mass: 20
    },
    gameplay: {
        health: 30,
        speed: 0.8,
        thrust: 8
    },
    explosion: {
        type: 'dust',
        lifespan: 2500,
        scale: { start: 3.0, end: 0.6 },
        speed: { min: 10, max: 35 },
        color: 0x2C2C2C, // Dark Granite
        particleCount: 40
    },
    createTextures: (scene: Phaser.Scene) => {
        // Base Texture
        for (let i = 0; i < 5; i++) {
            AsteroidTexture.create(scene, `asteroid-large-texture-${i}`, 32, { // Reduced radius 40 -> 32
                fill: 0x2C2C2C,      // Dark Granite
                stroke: 0x252525,
                fissure: 0x151515,   // Deep Dark
                highlight: 0x454545  // Grey Highlight
            });
        }

        // Surface Texture
        for (let i = 0; i < 5; i++) {
            AsteroidTexture.generateSurface(scene, `asteroid-large-surface-${i}`, 90, {
                fill: 0x2C2C2C, stroke: 0x252525, fissure: 0x151515, highlight: 0x454545
            });
        }
    }
};
