import Phaser from 'phaser';

export type MountIconType = 'plus' | 'minus';

export interface MountIconConfig {
    scene: Phaser.Scene;
    x: number;
    y: number;
    type: MountIconType;
    interactive?: boolean;
    blink?: boolean;
}

export class MountIconComponent {
    public container: Phaser.GameObjects.Container;

    constructor(config: MountIconConfig) {
        const { scene, x, y, type, interactive = false, blink = false } = config;

        // Base icon style
        const baseStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontSize: '24px',
            padding: { x: 5, y: 5 },
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, stroke: false, fill: true }
        };

        const iconLabel = scene.add.text(0, 0, '⚫️', baseStyle).setOrigin(0.5);
        const containerItems: Phaser.GameObjects.GameObject[] = [iconLabel];

        if (type === 'plus') {
            const plusLabel = scene.add.text(0.5, -0.5, '+', {
                fontFamily: 'Oswald, sans-serif',
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold',
                align: 'center',
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, stroke: false, fill: true }
            }).setOrigin(0.5);
            containerItems.push(plusLabel);
        } else {
            const minusLabel = scene.add.text(0.5, -4.5, '-', {
                fontFamily: 'Oswald, sans-serif',
                fontSize: '28px',
                color: '#ffffff',
                fontStyle: 'bold',
                align: 'center',
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, stroke: false, fill: true }
            }).setOrigin(0.5);
            containerItems.push(minusLabel);
        }

        this.container = scene.add.container(x, y, containerItems)
            .setSize(30, 30);

        if (interactive) {
            this.container.setInteractive({ useHandCursor: true });
        }

        if (blink) {
            scene.tweens.add({
                targets: this.container,
                alpha: 0.2,
                duration: 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    public on(event: string, fn: Function, context?: any) {
        this.container.on(event, fn, context);
        return this;
    }
}
