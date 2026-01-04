import Phaser from 'phaser';
import { TimeUtils } from '../../utils/time-utils';

// Cinematic Gas Explosion Constants
const EXPLOSION_PARTICLE_COUNT = 30; // More volumetric
const SMOKE_PARTICLE_COUNT = 20;     // Lingering smoke
const DEBRIS_PARTICLE_COUNT = 6;
const CORE_PARTICLE_COUNT = 8;
const SHOCKWAVE_RING_SIZE = 1.5;

// Timings
const EXPLOSION_LIFESPAN = { min: 400, max: 600 };
const SMOKE_LIFESPAN = { min: 600, max: 900 };
const DEBRIS_LIFESPAN = { min: 300, max: 500 };
const SHOCKWAVE_LIFESPAN = 300;
const FLASH_LIFESPAN = 100;
const CLEANUP_DELAY = 1000;

/**
 * An action-movie style gas explosion effect for rockets.
 * Features:
 * - Bright initial flash
 * - High-velocity debris sparks
 * - Volumetric expanding fireball (Start fast, slow down)
 * - Lingering dark smoke billowing out
 * - Shockwave ring
 */
export class RocketHitEffect {
    private fireballEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private smokeEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private debrisEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private coreEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private shockwaveEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private flashEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, x: number, y: number, color: number) {
        // Color Palette Derivation
        const primaryColorObj = Phaser.Display.Color.IntegerToColor(color);

        // Darker for smoke (almost black but tinted)
        const smokeColor = primaryColorObj.clone().darken(80).color;

        // Middle fireball color (Main)
        const fireColor = color;

        // Bright core (Lighter)
        const coreColor = primaryColorObj.clone().brighten(50).color;

        // 1. Flash - Instant bright center
        this.flashEmitter = scene.add.particles(0, 0, 'flare-white', {
            speed: 0,
            scale: { start: 2.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: FLASH_LIFESPAN,
            blendMode: 'ADD',
            tint: 0xffffff,
            emitting: false
        });

        // 2. Shockwave - Fast expanding ring
        this.shockwaveEmitter = scene.add.particles(0, 0, 'flare-white', {
            speed: 0,
            scale: { start: 0.2, end: SHOCKWAVE_RING_SIZE },
            alpha: { start: 0.8, end: 0 },
            lifespan: SHOCKWAVE_LIFESPAN,
            blendMode: 'ADD',
            tint: coreColor,
            emitting: false
        });

        // 3. Debris - Fast sparks flying outward
        this.debrisEmitter = scene.add.particles(0, 0, 'flare-white', {
            angle: { min: 0, max: 360 },
            speed: { min: 150, max: 300 },
            scale: { start: 0.3, end: 0 },
            lifespan: DEBRIS_LIFESPAN,
            blendMode: 'ADD',
            tint: coreColor,
            emitting: false
        });

        // 4. Fireball - The main gas explosion body
        // Uses high drag to simulate expanding gas stopping
        this.fireballEmitter = scene.add.particles(0, 0, 'flare-white', {
            angle: { min: 0, max: 360 },
            speed: { min: 50, max: 120 },
            scale: { start: 0.1, end: 1.0 }, // Expands significantly
            alpha: { start: 1, end: 0 },
            lifespan: EXPLOSION_LIFESPAN,
            blendMode: 'ADD',
            tint: [fireColor, coreColor],
            emitting: false,
            // Simple drag approximation by checking update (Phaser 3 particles don't have drag property in simple config usually, 
            // but we can simulate visual "puff" with scale expansion vs speed)
        });

        // 5. Smoke - Lingering dark cloud behind/around the fire
        this.smokeEmitter = scene.add.particles(0, 0, 'flare-white', {
            angle: { min: 0, max: 360 },
            speed: { min: 15, max: 50 },
            scale: { start: 0.5, end: 1.5 }, // Grows large
            alpha: { start: 0.5, end: 0 },
            lifespan: SMOKE_LIFESPAN,
            blendMode: 'NORMAL', // Normal blend to darken/obscure
            tint: smokeColor,
            emitting: false
        });

        // 6. Core - Intense center heat
        this.coreEmitter = scene.add.particles(0, 0, 'flare-white', {
            speed: 0,
            scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 300,
            blendMode: 'ADD',
            tint: coreColor,
            emitting: false
        });

        // Layering (Depth)
        // Smoke (Bottom) -> Fireball -> Core -> Flash (Top)
        this.shockwaveEmitter.setDepth(198);
        this.smokeEmitter.setDepth(199);
        this.fireballEmitter.setDepth(200);
        this.debrisEmitter.setDepth(201);
        this.coreEmitter.setDepth(202);
        this.flashEmitter.setDepth(203);

        // Explosions!
        this.flashEmitter.explode(1, x, y);
        this.shockwaveEmitter.explode(1, x, y);
        this.debrisEmitter.explode(DEBRIS_PARTICLE_COUNT, x, y);
        this.smokeEmitter.explode(SMOKE_PARTICLE_COUNT, x, y);
        this.fireballEmitter.explode(EXPLOSION_PARTICLE_COUNT, x, y);
        this.coreEmitter.explode(CORE_PARTICLE_COUNT, x, y);

        // Cleanup
        TimeUtils.delayedCall(scene, CLEANUP_DELAY, () => {
            if (this.flashEmitter?.active) this.flashEmitter.destroy();
            if (this.shockwaveEmitter?.active) this.shockwaveEmitter.destroy();
            if (this.debrisEmitter?.active) this.debrisEmitter.destroy();
            if (this.fireballEmitter?.active) this.fireballEmitter.destroy();
            if (this.smokeEmitter?.active) this.smokeEmitter.destroy();
            if (this.coreEmitter?.active) this.coreEmitter.destroy();
        });
    }
}
