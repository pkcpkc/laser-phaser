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
    private sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private centerEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, x: number, y: number, config: ExplosionConfig) {
        this.emitter = scene.add.particles(0, 0, `flare-${config.frame}`, {
            angle: { min: 0, max: 360 },
            speed: config.speed || { min: 50, max: 150 },
            scale: config.scale || { start: 0.4, end: 0 },
            lifespan: config.lifespan || 500,
            blendMode: config.blendMode || 'ADD',
            emitting: false
        });

        this.sparkEmitter = scene.add.particles(0, 0, 'flare-white', {
            speed: 0,
            scale: { start: 0.3, end: 0 },
            lifespan: 100,
            blendMode: 'NORMAL',
            frequency: 30, // Emit every 30ms
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Circle(0, 0, 32)
            } as Phaser.Types.GameObjects.Particles.EmitZoneData,
            emitting: false
        });

        this.centerEmitter = scene.add.particles(0, 0, 'flare-white', {
            speed: 0,
            scale: { start: 2, end: 0 },
            lifespan: 300,
            blendMode: 'ADD',
            tint: 0xffa500, // Orange
            emitting: false
        });



        this.emitter.setDepth(200);
        this.sparkEmitter.setDepth(201);
        this.centerEmitter.setDepth(199);

        this.emitter.explode(16, x, y);
        this.centerEmitter.explode(1, x, y);

        this.sparkEmitter.setPosition(x, y);
        this.sparkEmitter.start(0, 600); // Run for 600ms

        // Auto destroy emitter after explosion
        scene.time.delayedCall(1000, () => {
            this.emitter.destroy();
            this.sparkEmitter.destroy();
            this.centerEmitter.destroy();
        });
    }
}
