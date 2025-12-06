import Phaser from 'phaser';
import { BigCruiser } from '../ships/big-cruiser';
import { BloodHunter } from '../ships/blood-hunter';

export default class PreloadScene extends Phaser.Scene {
    private startTime: number = 0;
    private logo!: Phaser.GameObjects.Image;

    constructor() {
        super('PreloadScene');
    }

    init() {
        this.startTime = Date.now();
    }

    preload() {
        const { width, height } = this.scale;

        // Display logo (loaded in BootScene)
        this.logo = this.add.image(width / 2, height / 2, 'logo');
        this.logo.setOrigin(0.5, 0.5);

        // Optional: Add a simple loading bar if we wanted, but user asked for just the screen.

        // Load Game Assets
        // From BaseScene
        this.load.image(BigCruiser.assetKey, BigCruiser.assetPath);
        this.load.atlas('flares', 'assets/particles/flares.png', 'assets/particles/flares.json');
        this.load.image('nebula', 'assets/backgrounds/nebula.png');

        // From BloodHuntersScene
        this.load.image(BloodHunter.assetKey, BloodHunter.assetPath);
    }

    create() {
        console.log('PreloadScene: create started');
        const width = this.scale.width;
        const height = this.scale.height;

        // Logo positioning and scaling
        if (this.logo) {
            this.logo.setPosition(width / 2, height / 2 - 50);

            // Responsive scaling: Fit within 80% of width, max scale 0.8
            const maxLogoWidth = width * 0.8;
            const scale = Math.min(maxLogoWidth / this.logo.width, 0.8);
            this.logo.setScale(scale);
        }

        // Position text relative to the image
        let textY = height - 100; // Default fallback
        if (this.logo) {
            const logoBottom = this.logo.y + (this.logo.displayHeight / 2);
            textY = logoBottom + 50; // 50px pudding below image
        }

        const loadingText = this.add.text(width / 2, textY, 'LOADING...', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const minDuration = 3000; // 3 seconds
        const elapsedTime = Date.now() - this.startTime;
        const remainingTime = Math.max(0, minDuration - elapsedTime);

        console.log(`PreloadScene: elapsed ${elapsedTime}ms, waiting ${remainingTime}ms`);

        const onLoadingComplete = () => {
            console.log('PreloadScene: loading complete, waiting for input');
            loadingText.setText('Press FIRE to Start');

            // Blink effect for the text
            this.tweens.add({
                targets: loadingText,
                alpha: 0,
                duration: 500,
                yoyo: true,
                repeat: -1
            });

            // Input listeners
            this.input.on('pointerdown', () => this.startGame());
            this.input.keyboard!.on('keydown-SPACE', () => this.startGame());
        };

        if (remainingTime > 0) {
            this.time.delayedCall(remainingTime, onLoadingComplete);
        } else {
            onLoadingComplete();
        }
    }

    private startGame() {
        this.scene.start('BloodHunters');
    }
}
