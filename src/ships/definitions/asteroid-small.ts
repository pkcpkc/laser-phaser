import Phaser from 'phaser';
import type { ShipDefinition, ShipMarker } from '../types';
import { AsteroidTexture } from '../textures/asteroid-texture';


// Standard drive marker for all asteroids (center position, pointing down)
export const asteroidDriveMarker: ShipMarker = {
    type: 'drive',
    x: 8, // Rear position (Up on screen when falling)
    y: 16, // Center position (Centered horizontally)
    angle: 0
};

export const SmallAsteroidDefinition: ShipDefinition = {
    id: 'asteroid-small',
    assetKey: 'asteroid-small-texture',
    assetPath: '',
    markers: [asteroidDriveMarker],
    physics: {
        frictionAir: 0.05,
        fixedRotation: false,
        mass: 10
    },
    gameplay: {
        health: 5,
        speed: 1.5,
        thrust: 15
    },
    explosion: {
        type: 'dust',
        lifespan: 2000,
        scale: { start: 1.2, end: 0.4 },
        speed: { min: 10, max: 25 },
        color: 0x2C2C2C, // Dark Granite
        particleCount: 15
    },
    createTextures: (scene: Phaser.Scene) => {
        // Base texture (required by Ship class check, sprite is hidden by morph effect)
        AsteroidTexture.create(scene, 'asteroid-small-texture', 15, {
            fill: 0x2C2C2C, stroke: 0x252525, fissure: 0x151515, highlight: 0x454545
        });
        // Base Texture Variants
        for (let i = 0; i < 5; i++) {
            AsteroidTexture.create(scene, `asteroid-small-texture-${i}`, 15, { // Aligned radius to 15
                fill: 0x2C2C2C,      // Dark Granite
                stroke: 0x252525,
                fissure: 0x151515,   // Near Black
                highlight: 0x454545  // Grey Highlight
            });
        }

        // Surface Texture (Variants for morphing)
        // Check if already exists to avoid regen? The create/generateSurface methods check existence internally usually.
        // Actually AsteroidTexture.create checks, but generateSurface should too.
        // Let's assume we just call it.
        for (let i = 0; i < 5; i++) {
            AsteroidTexture.generateSurface(scene, `asteroid-small-surface-${i}`, 40, {
                fill: 0x2C2C2C, stroke: 0x252525, fissure: 0x151515, highlight: 0x454545
            });
        }
    }
};




