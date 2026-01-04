import Phaser from 'phaser';
import { TimeUtils } from '../../utils/time-utils';

/**
 * Dust explosion effect - perfect for rocky asteroids
 * Creates a cloud of dust particles that expand and fade
 */
export class DustExplosion {
    private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private debrisEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        config?: {
            color?: number;
            particleCount?: number;
            speed?: { min: number; max: number };
            scale?: { start: number; end: number };
            lifespan?: number;
            radius?: number;
        }
    ) {
        const dustColor = config?.color ?? 0x8B7355; // Brown/tan dust
        const particleCount = config?.particleCount ?? 15; // Further reduced default
        const speed = config?.speed ?? { min: 5, max: 20 }; // Even slower
        const scale = config?.scale ?? { start: 1.5, end: 0.5 }; // Valid scale
        const lifespan = config?.lifespan ?? 2000;
        const radius = config?.radius ?? 20; // Default radius if not passed

        // Create dust cloud texture if it doesn't exist
        const dustKey = 'dust-cloud-particle';
        if (!scene.textures.exists(dustKey)) {
            const graphics = scene.add.graphics();
            // Soft cloud puff
            graphics.fillStyle(0xffffff, 0.4);
            graphics.fillCircle(16, 16, 16);
            graphics.fillStyle(0xffffff, 0.3);
            graphics.fillCircle(10, 10, 12);
            graphics.fillStyle(0xffffff, 0.3);
            graphics.fillCircle(22, 22, 10);
            graphics.generateTexture(dustKey, 32, 32);
            graphics.destroy();
        }

        // Emit Zone for distributed cloud
        const emitZone = {
            type: 'random',
            source: new Phaser.Geom.Circle(0, 0, radius * 0.8) // Use 80% of radius to keep mostly inside
        };

        // Main dust cloud - slow expanding
        this.dustEmitter = scene.add.particles(0, 0, dustKey, {
            angle: { min: 0, max: 360 },
            speed: speed,
            scale: scale,
            lifespan: lifespan,
            tint: dustColor,
            alpha: { start: 0.3, end: 0 }, // Lower alpha (was 0.4)
            rotate: { min: 0, max: 360 },
            blendMode: 'NORMAL',
            emitZone: emitZone as any,
            emitting: false
        });

        // Debris chunks - smaller, faster moving pieces
        this.debrisEmitter = scene.add.particles(0, 0, dustKey, {
            angle: { min: 0, max: 360 },
            speed: { min: speed.max, max: speed.max * 3 },
            scale: { start: 0.3, end: 0 },
            lifespan: lifespan * 0.5,
            tint: config?.color ? (config.color - 0x202020) : 0x5a5a5a, // Darker tint
            alpha: { start: 1, end: 0 },
            blendMode: 'NORMAL',
            emitting: false
        });

        this.dustEmitter.setDepth(180);
        this.debrisEmitter.setDepth(181);

        // Emit particles
        this.dustEmitter.explode(particleCount, x, y);
        this.debrisEmitter.explode(Math.floor(particleCount / 3), x, y);

        // Auto cleanup
        TimeUtils.delayedCall(scene, lifespan + 100, () => {
            this.dustEmitter.destroy();
            this.debrisEmitter.destroy();
        });
    }
}
