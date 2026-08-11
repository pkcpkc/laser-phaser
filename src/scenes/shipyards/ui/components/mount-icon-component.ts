import Phaser from 'phaser';

export type MountIconType = 'plus' | 'minus';

export interface MountIconConfig {
    scene: Phaser.Scene;
    x: number;
    y: number;
    type: MountIconType;
    interactive?: boolean;
    blink?: boolean;
    color?: number;
}

export class MountIconComponent {
    public container: Phaser.GameObjects.Container;
    private graphics: Phaser.GameObjects.Graphics;

    constructor(config: MountIconConfig) {
        const { scene, x, y, type, interactive = false, blink = false, color = 0x00ffff } = config;

        this.graphics = scene.add.graphics();
        this.drawReticle(type, color);

        this.container = scene.add.container(x, y, [this.graphics])
            .setSize(30, 30);

        if (interactive) {
            this.container.setInteractive({ useHandCursor: true });
        }

        if (blink) {
            scene.tweens.add({
                targets: this.container,
                alpha: 0.3,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    private drawReticle(type: MountIconType, color: number) {
        this.graphics.clear();
        
        // Inner fill
        this.graphics.fillStyle(0x0c121e, 0.6);
        this.graphics.fillCircle(0, 0, 11);

        // Outer reticle circle
        this.graphics.lineStyle(1.5, color, 0.85);
        this.graphics.strokeCircle(0, 0, 11);
        
        // Crosshair ticks
        this.graphics.lineStyle(1, color, 0.65);
        this.graphics.lineBetween(0, -11, 0, -8);
        this.graphics.lineBetween(0, 8, 0, 11);
        this.graphics.lineBetween(-11, 0, -8, 0);
        this.graphics.lineBetween(8, 0, 11, 0);

        if (type === 'plus') {
            // white/cyan plus
            this.graphics.lineStyle(2, 0xffffff, 0.95);
            this.graphics.lineBetween(-4, 0, 4, 0);
            this.graphics.lineBetween(0, -4, 0, 4);
        } else {
            // red minus (represents un-equipping)
            this.graphics.lineStyle(2, 0xff3333, 0.95);
            this.graphics.lineBetween(-4, 0, 4, 0);
        }
    }

    public on(event: string, fn: Function, context?: any) {
        this.container.on(event, fn, context);
        return this;
    }
}
