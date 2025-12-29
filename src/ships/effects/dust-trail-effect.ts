import Phaser from 'phaser';

/**
 * Dust trail effect for asteroids - creates a subtle particle trail
 * that follows the asteroid as it moves through space.
 */
export class DustTrailEffect {
    private scene: Phaser.Scene;
    private sprite: Phaser.GameObjects.Image | Phaser.Physics.Matter.Image;
    private coreEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private updateListener: () => void;
    private color: number;

    constructor(
        scene: Phaser.Scene,
        sprite: Phaser.GameObjects.Image | Phaser.Physics.Matter.Image,
        config?: {
            color?: number;
            scale?: number;
            frequency?: number;
        }
    ) {
        this.scene = scene;
        this.sprite = sprite;
        this.color = config?.color ?? 0x8B7355; // Brown dust default
        const scale = config?.scale ?? 1;
        const frequency = config?.frequency ?? 50; // More frequent emission for comet look

        // Create dust particle texture if needed
        const dustKey = 'dust-trail-particle';
        if (!scene.textures.exists(dustKey)) {
            const graphics = scene.add.graphics();
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(4, 4, 4);
            graphics.generateTexture(dustKey, 8, 8);
            graphics.destroy();
        }

        // Helper to create directional emission callback
        const createEmitCallback = (minSpeed: number, maxSpeed: number, spreadDeg: number) => {
            return (particle: Phaser.GameObjects.Particles.Particle) => {
                if (!this.sprite || !this.sprite.active) return;

                let emitAngleRad = this.sprite.rotation + Math.PI; // Default: Rear of rotation

                // Use velocity for direction if available
                if ('body' in this.sprite && this.sprite.body) {
                    const body = this.sprite.body as MatterJS.BodyType;
                    // Check if moving fast enough to have a direction
                    if (Math.abs(body.velocity.x) > 0.1 || Math.abs(body.velocity.y) > 0.1) {
                        emitAngleRad = Math.atan2(body.velocity.y, body.velocity.x) + Math.PI;
                    }
                }

                // const emitAngleDeg = Phaser.Math.RadToDeg(emitAngleRad);

                // Random spread
                const spreadRad = Phaser.Math.DegToRad(Phaser.Math.Between(-spreadDeg, spreadDeg));
                const finalAngle = emitAngleRad + spreadRad;

                const speed = Phaser.Math.Between(minSpeed, maxSpeed);

                particle.velocityX = Math.cos(finalAngle) * speed;
                particle.velocityY = Math.sin(finalAngle) * speed;
            };
        };

        // 1. Long Comet Tail (fading dust)
        this.emitter = scene.add.particles(0, 0, dustKey, {
            tint: this.color,
            alpha: { start: 0.5, end: 0 },
            scale: { start: 0.8 * scale, end: 0.1 * scale },
            lifespan: { min: 1500, max: 2500 },
            blendMode: 'NORMAL',
            quantity: 5,
            frequency: frequency / 2,
            emitting: true,
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Circle(0, 0, 15 * scale) // Slightly tighter source (20->15)
            } as Phaser.Types.GameObjects.Particles.EmitZoneData,
            emitCallback: createEmitCallback(20, 60, 15) // Narrow spread (30->15) for directional stream
        });

        // 2. Bright Core (dense dust near asteroid)
        this.coreEmitter = scene.add.particles(0, 0, dustKey, {
            tint: this.color, // Use exact asteroid color
            alpha: { start: 1, end: 0 },
            scale: { start: 0.5 * scale, end: 0 },
            lifespan: 600,
            blendMode: 'NORMAL',
            quantity: 3,
            frequency: frequency * 0.4,
            emitting: true,
            emitCallback: createEmitCallback(40, 80, 20) // Narrow spread
        });

        this.emitter.setDepth(89);
        this.coreEmitter.setDepth(90);

        // Position sync
        this.updateListener = () => this.update();
        this.scene.events.on('update', this.updateListener);

        // Cleanup when sprite is destroyed
        this.sprite.once('destroy', () => this.destroy());
    }

    private update() {
        if (!this.sprite.active) {
            this.destroy();
            return;
        }

        // Follow the asteroid
        this.emitter.setPosition(this.sprite.x, this.sprite.y);
        this.coreEmitter.setPosition(this.sprite.x, this.sprite.y);
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        if (this.emitter.active) {
            this.emitter.destroy();
        }
        if (this.coreEmitter.active) {
            this.coreEmitter.destroy();
        }
    }
}
