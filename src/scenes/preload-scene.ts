import Phaser from 'phaser';
import { BigCruiser } from '../ships/big-cruiser';
import { BloodHunter } from '../ships/blood-hunter';

export default class PreloadScene extends Phaser.Scene {
    private startTime: number = 0;
    private logo!: Phaser.GameObjects.Image;
    private loadingText!: Phaser.GameObjects.Text;

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

        // Create the loading text initially
        this.loadingText = this.add.text(0, 0, 'LOADING...', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Initial layout update
        this.updateLayout();

        // Listen for resize events
        this.scale.on('resize', this.resize, this);

        const minDuration = 3000; // 3 seconds
        const elapsedTime = Date.now() - this.startTime;
        const remainingTime = Math.max(0, minDuration - elapsedTime);

        console.log(`PreloadScene: elapsed ${elapsedTime}ms, waiting ${remainingTime}ms`);

        const onLoadingComplete = () => {
            console.log('PreloadScene: loading complete, waiting for input');
            this.loadingText.setText('Press FIRE to Start');

            // Blink effect for the text
            this.tweens.add({
                targets: this.loadingText,
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

    resize() {
        this.updateLayout();
    }

    updateLayout() {
        if (!this.logo || !this.loadingText) return;

        const width = this.scale.width;
        const height = this.scale.height;

        // 1. Reset scale to 1 to get original dimensions for calculation
        this.logo.setScale(1);

        // 2. Calculate constraints
        // We want the logo to be at most 80% of width and 60% of height
        // Leaving 40% height for text and padding
        const maxLogoWidth = width * 0.8;
        const maxLogoHeight = height * 0.6;

        const scaleX = maxLogoWidth / this.logo.width;
        const scaleY = maxLogoHeight / this.logo.height;

        // Use the smaller scale to ensure it fits both dimensions (contain)
        // Cap at 0.8 (don't scale up pixel art too huge if screen is massive, though usually fine)
        // Actually, let's remove the 0.8 cap if the user wants it "always visible" 
        // but typically 1.0 or so is a good max if the image is high res. 
        // Let's cap at 1.0 to avoid pixelation if the asset is small, 
        // OR just rely on fit. The user said "fully visible". 
        // Let's stick to the ratio.
        const scale = Math.min(scaleX, scaleY, 1.0);

        this.logo.setScale(scale);

        // 3. Center the logo, but maybe shift it up slightly to make room for text
        // Let's center it visually in the "content area"

        // Position logo in the center of the screen
        const logoY = height / 2 - (height * 0.05); // slightly up
        this.logo.setPosition(width / 2, logoY);

        // 4. Position text below logo
        const logoBottom = logoY + (this.logo.displayHeight / 2);
        const textY = logoBottom + 40; // 40px padding

        this.loadingText.setPosition(width / 2, textY);
    }

    private startGame() {
        this.scale.off('resize', this.resize, this); // Clean up listener
        this.scene.start('BloodHunters');
    }
}
