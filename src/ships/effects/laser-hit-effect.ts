import Phaser from 'phaser';
import { TimeUtils } from '../../utils/time-utils';

// Hit effect constants - designed to be quick and subtle
const HIT_PARTICLE_COUNT = 6;
const HIT_LIFESPAN = 150;
const HIT_SPEED = { min: 40, max: 100 };
const HIT_SCALE = { start: 0.3, end: 0 };
const HIT_CLEANUP_DELAY = 300;

/**
 * A short, subtle hit effect for laser impacts.
 * Creates a small burst of particles when a laser hits a target.
 */
export class LaserHitEffect {
    private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, x: number, y: number, color: number = 0xffffff) {
        // Create the hit particle emitter
        this.emitter = scene.add.particles(0, 0, 'flare-white', {
            angle: { min: 0, max: 360 },
            speed: HIT_SPEED,
            scale: HIT_SCALE,
            lifespan: HIT_LIFESPAN,
            blendMode: 'ADD',
            tint: color,
            emitting: false
        });

        this.emitter.setDepth(200);

        // Emit particles at the hit location
        this.emitter.explode(HIT_PARTICLE_COUNT, x, y);

        // Auto-cleanup after effect completes
        TimeUtils.delayedCall(scene, HIT_CLEANUP_DELAY, () => {
            if (this.emitter && this.emitter.active) {
                this.emitter.destroy();
            }
        });
    }
}
