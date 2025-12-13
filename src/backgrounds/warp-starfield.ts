import Phaser from 'phaser';

export class WarpStarfield {
    private scene: Phaser.Scene;
    private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, width: number, height: number) {
        this.scene = scene;
        this.createTexture();
        this.emitter = this.createEmitter(width, height);
    }

    private createTexture() {
        if (!this.scene.textures.exists('star')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 2, 2);
            graphics.generateTexture('star', 2, 2);
            graphics.destroy();
        }
    }

    private createEmitter(width: number, height: number): Phaser.GameObjects.Particles.ParticleEmitter {
        const emitter = this.scene.add.particles(width / 2, height / 2, 'star', {
            lifespan: 3000,
            speed: { min: 100, max: 250 },
            scale: { start: 0.5, end: 1.5 }, // Increased scale since base is 2x2 px
            alpha: { start: 0, end: 1, ease: 'Sine.easeInOut' }, // Fade in then stay
            angle: { min: 0, max: 360 },
            blendMode: 'ADD',
            frequency: 50,
            quantity: 2
        });

        // Background depth
        emitter.setDepth(-90);

        return emitter;
    }

    public resize(width: number, height: number) {
        if (this.emitter) {
            this.emitter.setPosition(width / 2, height / 2);
        }
    }

    public destroy() {
        if (this.emitter) {
            this.emitter.destroy();
        }
    }
}
