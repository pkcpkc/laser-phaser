import Phaser from 'phaser';
import { LootType } from './types';
import { ObjectPool } from '../utils/object-pool';

export class Loot extends Phaser.Physics.Matter.Image {
    public lootType!: LootType;
    public readonly value: number = 1; // Default value as requested

    private static scenePools: WeakMap<Phaser.Scene, Record<string, ObjectPool<Loot>>> = new WeakMap();
    private particles?: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, textureKey: string) {
        // Spawn offscreen natively
        super(scene.matter.world, -9999, -9999, textureKey);
        scene.add.existing(this);

        // Physics properties
        this.setFrictionAir(0.05);
        this.setBounce(0.5);
        this.setSensor(true);
        this.setIgnoreGravity(true);
    }

    public static getFromPool(scene: Phaser.Scene, x: number, y: number, lootType: LootType): Loot {
        const text = lootType;
        const charCode = text.codePointAt(0)?.toString() || 'loot';
        const textureKey = `loot-${charCode}`;

        if (!scene.textures.exists(textureKey)) {
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

        if (!Loot.scenePools.has(scene)) {
            Loot.scenePools.set(scene, {});
            scene.events.once('shutdown', () => {
                Loot.scenePools.delete(scene);
            });
        }

        const pools = Loot.scenePools.get(scene)!;
        if (!pools[textureKey]) {
            pools[textureKey] = new ObjectPool<Loot>(() => new Loot(scene, textureKey), 20);
        }

        const loot = pools[textureKey].get();
        loot.spawn(x, y, lootType);
        return loot;
    }

    public spawn(x: number, y: number, lootType: LootType) {
        this.lootType = lootType;
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setAwake();
        this.setAlpha(1);
        this.setScale(1);

        const lifespan = 3000;

        if (lootType === LootType.MODULE) {
            if (!this.particles) {
                this.particles = this.scene.add.particles(0, 0, 'flare-white', {
                    color: [0xffffff],
                    lifespan: 1000,
                    angle: { min: 0, max: 360 },
                    scale: { start: 0.3, end: 0 },
                    speed: { min: 10, max: 30 },
                    blendMode: 'ADD',
                    follow: this,
                    frequency: 100
                });
            } else {
                this.particles.start();
            }

            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                duration: 500,
                delay: lifespan - 500,
                onComplete: () => {
                    if (this.active) this.destroy();
                }
            });
        } else {
            const flipDuration = lifespan / 4.5;

            this.scene.tweens.chain({
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
                            if (this.active) this.destroy();
                        }
                    }
                ]
            });
        }
    }

    override destroy(fromScene?: boolean) {
        if (this.scene) {
            this.scene.tweens.killTweensOf(this);
        }

        if (this.particles) {
            this.particles.stop();
        }

        let poolForRelease: ObjectPool<Loot> | undefined;

        // Use this.texture.key to get the texture key used for pooling
        if (!fromScene && this.texture && this.scene && Loot.scenePools.has(this.scene)) {
            const pools = Loot.scenePools.get(this.scene);
            if (pools && pools[this.texture.key]) {
                poolForRelease = pools[this.texture.key];
            }
        }

        if (poolForRelease) {
            poolForRelease.release(this);
        } else {
            if (this.particles) this.particles.destroy();
            super.destroy(fromScene);
        }
    }
}
