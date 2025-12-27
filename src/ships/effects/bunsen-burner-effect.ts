import Phaser from 'phaser';

export class BunsenBurnerEffect {
    private scene: Phaser.Scene;
    private module: Phaser.GameObjects.Image;
    private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    private updateListener: () => void;

    constructor(scene: Phaser.Scene, module: Phaser.GameObjects.Image) {
        this.scene = scene;
        this.module = module;

        this.createEmitters();

        this.updateListener = () => this.update();
        this.scene.events.on('update', this.updateListener);

        this.module.on('destroy', this.destroy, this);
    }

    private createEmitters() {
        const createCallback = (minSpeed: number, maxSpeed: number, spread: number) => {
            return (particle: Phaser.GameObjects.Particles.Particle) => {
                if (!this.module || !this.module.active) return;

                const rotation = this.module.rotation;
                const angleDeg = Phaser.Math.RadToDeg(rotation);
                // Adjust +90 or +180 depending on sprite orientation. 
                // Assuming +90 based on previous standard for "up/forward" in Phaser physics vs sprites
                // Let's rely on standard rotation. Usually velocity is along rotation vector.
                const emitAngleDeg = angleDeg;
                const emitAngleRad = Phaser.Math.DegToRad(emitAngleDeg);

                // Random spread
                const spreadRad = Phaser.Math.DegToRad(Phaser.Math.Between(-spread, spread));
                const finalAngle = emitAngleRad + spreadRad;

                const speed = Phaser.Math.Between(minSpeed, maxSpeed);

                particle.velocityX = Math.cos(finalAngle) * speed;
                particle.velocityY = Math.sin(finalAngle) * speed;

                // Optional: Rotate particle texture to match direction
                // particle.rotation = finalAngle;
            };
        };

        // Core Flame - Blue, Small, Fast
        const coreEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: [0x00ffff, 0x0088ff],
            alpha: { start: 1, end: 0 },
            scale: { start: 0.4, end: 0.1 },
            lifespan: { min: 300, max: 500 },
            blendMode: 'ADD',
            quantity: 1,
            frequency: 20,
            emitting: true,
            emitCallback: createCallback(200, 300, 5) // High speed, narrow spread
        });
        this.emitters.push(coreEmitter);

        // Outer Flame - Dark Blue, Larger, Slower
        const outerEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: [0x0044aa, 0x002255],
            alpha: { start: 0.5, end: 0 },
            scale: { start: 0.6, end: 0.2 },
            lifespan: { min: 400, max: 600 },
            blendMode: 'ADD',
            quantity: 1,
            frequency: 30,
            emitting: true,
            emitCallback: createCallback(100, 200, 10) // Slower, wider spread
        });
        this.emitters.push(outerEmitter);

        // Sparks - Tiny, Wide spread
        const sparkEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: [0xffffff, 0xaaddff],
            alpha: { start: 1, end: 0 },
            scale: { start: 0.2, end: 0 },
            lifespan: { min: 400, max: 800 },
            blendMode: 'ADD',
            quantity: 1,
            frequency: 100,
            emitting: true,
            emitCallback: createCallback(200, 400, 45) // Fast, very wide spread
        });
        this.emitters.push(sparkEmitter);

        this.emitters.forEach(e => e.setDepth(100));
    }

    private update() {
        if (!this.module.active) {
            // Can stop if desired, but letting them trail is nice
        } else {
            this.emitters.forEach(e => {
                if (!e.emitting) e.start();
            });
        }

        // Manual Position Sync (Anti-Culling)
        const x = this.module.x;
        const y = this.module.y;
        this.emitters.forEach(e => {
            e.setPosition(x, y);
            e.setDepth(100);
        });

        // NO setConfig calls here! 
        // Angle is handled by emitCallback.
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        this.emitters.forEach(e => {
            if (e.active) e.destroy();
        });
        this.emitters = [];
    }
}
