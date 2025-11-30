import Phaser from 'phaser';

export interface ExplosionConfig {
    frame: string;
    speed?: { min: number; max: number };
    scale?: { start: number; end: number };
    lifespan?: number;
    blendMode?: string | Phaser.BlendModes;
}

export class Explosion {
    private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, x: number, y: number, config: ExplosionConfig) {
        this.emitter = scene.add.particles(0, 0, 'flares', {
            frame: config.frame,
            angle: { min: 0, max: 360 },
            speed: config.speed || { min: 50, max: 150 },
            scale: config.scale || { start: 0.4, end: 0 },
            lifespan: config.lifespan || 500,
            blendMode: config.blendMode || 'ADD',
            emitting: false
        });

        this.emitter.setDepth(200);
        this.emitter.explode(16, x, y);

        // Auto destroy emitter after explosion
        scene.time.delayedCall(1000, () => {
            this.emitter.destroy();
        });
    }
}
