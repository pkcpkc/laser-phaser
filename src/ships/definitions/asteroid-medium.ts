import type { ShipDefinition, ShipMarker } from '../types';
import { AsteroidTexture } from '../textures/asteroid-texture';
import { AsteroidMorphEffect } from '../effects/asteroid-morph-effect';

// Debug comment to force update
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
        frictionAir: 0.05,
        fixedRotation: false,
        mass: 13,
        massRange: { min: 11, max: 15 },
        initialAngle: 90
    },
    randomizeAssetKey: (_scene: Phaser.Scene) => {
        return `asteroid-medium-texture-${Phaser.Math.Between(0, 4)}`;
    },
    createEffect: (scene: Phaser.Scene, ship: any) => {
        return new AsteroidMorphEffect(scene, ship.sprite, 'asteroid-medium-surface', 20, 5);
    },
    gameplay: {
        health: 15,
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
    },
    createTextures: (scene: Phaser.Scene) => {
        // Base texture (required by Ship class check, sprite is hidden by morph effect)
        AsteroidTexture.create(scene, 'asteroid-medium-texture', 20, {
            fill: 0x2C2C2C, stroke: 0x252525, fissure: 0x151515, highlight: 0x454545
        });
        // Base Texture Variants
        for (let i = 0; i < 5; i++) {
            AsteroidTexture.create(scene, `asteroid-medium-texture-${i}`, 20, { // Reduced radius 25 -> 20
                fill: 0x2C2C2C,      // Dark Granite
                stroke: 0x252525,
                fissure: 0x151515,   // Deep Dark
                highlight: 0x454545  // Grey Highlight
            });
        }

        // Surface Texture
        for (let i = 0; i < 5; i++) {
            AsteroidTexture.generateSurface(scene, `asteroid-medium-surface-${i}`, 60, {
                fill: 0x2C2C2C, stroke: 0x252525, fissure: 0x151515, highlight: 0x454545
            });
        }
    }
};


