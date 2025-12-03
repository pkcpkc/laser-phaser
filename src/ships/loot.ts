import Phaser from 'phaser';
import type { LootConfig } from './types';

export class Loot extends Phaser.Physics.Matter.Image {
    public readonly config: LootConfig;

    constructor(scene: Phaser.Scene, x: number, y: number, config: LootConfig) {
        // console.log('Creating Loot', config);
        // Use type or text for texture key, ensuring it's safe
        let text = config.text;
        if (config.type === 'gem') text = '💎';
        if (config.type === 'mount') text = '📦';

        const safeKey = config.type || text.codePointAt(0)?.toString() || 'loot';
        const textureKey = `loot-${safeKey}`;

        if (!scene.textures.exists(textureKey)) {
            // console.log('Generating Loot Texture', textureKey);
            const textObj = scene.make.text({ text: text, style: { fontSize: '32px' } }, false);
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (context) {
                const padding = 10;
                canvas.width = textObj.width + padding;
                canvas.height = textObj.height + padding;
                context.font = '32px Arial';
                context.fillStyle = '#ffffff';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(text, canvas.width / 2, canvas.height / 2);
                scene.textures.addCanvas(textureKey, canvas);
            }
            textObj.destroy();
        }

        super(scene.matter.world, x, y, textureKey);
        this.config = config;
        scene.add.existing(this);

        // Physics properties
        this.setFrictionAir(0.05);
        this.setBounce(0.5);
        this.setSensor(true); // Make it a sensor so it doesn't physically collide


        // Simulated Z-axis rotation (flipping)
        // We want exactly 3s lifespan (or config.lifespan)
        // We want to end on "side" (scaleX = 0)
        // Pattern: 1 -> -1 (1), -1 -> 1 (2), 1 -> -1 (3), -1 -> 1 (4), 1 -> 0 (4.5)
        // Wait, user said "exactly 2.5 times".
        // 1 full rotation = 1 -> -1 -> 1.
        // 2.5 rotations = (1->-1->1) * 2 + (1->0).
        // Segments:
        // 1. 1->-1 (duration)
        // 2. -1->1 (duration)
        // 3. 1->-1 (duration)
        // 4. -1->1 (duration)
        // 5. 1->0  (duration/2)
        // Total = 4.5 * duration.

        const lifespan = config.lifespan || 3000;

        if (config.type === 'mount') {
            // Add flare effect
            const particles = scene.add.particles(0, 0, 'flares', {
                frame: 'white',
                color: [0xffffff],
                lifespan: 1000,
                angle: { min: 0, max: 360 },
                scale: { start: 0.3, end: 0 },
                speed: { min: 10, max: 30 },
                blendMode: 'ADD',
                follow: this,
                frequency: 100
            });

            // Ensure particles are destroyed when loot is destroyed
            this.on('destroy', () => {
                particles.destroy();
            });

            // Simple fade out for mount
            scene.tweens.add({
                targets: this,
                alpha: 0,
                duration: 500,
                delay: lifespan - 500,
                onComplete: () => {
                    if (this.active) {
                        this.destroy();
                    }
                }
            });
        } else {
            const flipDuration = lifespan / 4.5;

            scene.tweens.chain({
                targets: this,
                tweens: [
                    {
                        scaleX: -1,
                        duration: flipDuration,
                        yoyo: true,
                        repeat: 1, // Runs twice: 1->-1->1, 1->-1->1
                        ease: 'Sine.easeInOut'
                    },
                    {
                        scaleX: 0,
                        duration: flipDuration / 2,
                        ease: 'Sine.easeIn',
                        onComplete: () => {
                            if (this.active) {
                                this.destroy();
                            }
                        }
                    }
                ]
            });
        }

        // Removed fixed lifespan timer as it's now controlled by the animation

    }

    destroy(fromScene?: boolean) {
        if (this.scene) {
            this.scene.tweens.killTweensOf(this);
        }
        super.destroy(fromScene);
    }
}
