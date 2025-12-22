import Phaser from 'phaser';
// import { BigCruiser } from '../ships/big-cruiser';
// import { BloodHunter } from '../ships/blood-hunter';
// import { GreenRocketCarrier } from '../ships/green-rocket-carrier';
import { createFlareTexture } from '../utils/texture-generator';

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
        this.logo.setAlpha(0); // Hide initially to prevent size jump

        // Add error handlers for asset loading
        this.load.on('loaderror', (file: any) => {
            console.error('Error loading file:', file.key, file.src);
        });

        this.load.on('filecomplete', (key: string) => {
            console.log('File loaded:', key);
        });

        this.load.on('complete', () => {
            console.log('All assets loaded successfully');
        });

        // Load Game Assets
        // From BaseScene
        this.load.atlas('ships', 'assets/ships.png', 'assets/ships.json');
        this.load.image('nebula', 'assets/nebula.png');
        this.load.image('blood_nebula', 'assets/blood_nebula.png');
    }

    create() {
        console.log('PreloadScene: create started');

        // Generate procedural textures
        this.generateFlares();

        // Create the loading text initially
        // Use left origin (0, 0.5) so text doesn't shift when dot count changes
        this.loadingText = this.add.text(0, 0, 'LOADING...', {
            fontFamily: 'Oswald, Impact, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        // Animate the dots by creating a fade effect
        // We'll create separate text objects for each dot and animate them
        this.animateLoadingDots();

        // Initial layout update
        this.updateLayout();

        // Listen for resize events
        this.scale.on('resize', this.resize, this);

        const minDuration = 3000; // 3 seconds
        const elapsedTime = Date.now() - this.startTime;
        const remainingTime = Math.max(0, minDuration - elapsedTime);

        console.log(`PreloadScene: elapsed ${elapsedTime}ms, waiting ${remainingTime}ms`);

        const onLoadingComplete = () => {
            console.log('PreloadScene: loading complete, starting game');
            this.startGame();
        };

        if (remainingTime > 0) {
            this.time.delayedCall(remainingTime, onLoadingComplete);
        } else {
            onLoadingComplete();
        }
    }

    private animateLoadingDots() {
        // Create a simple animation by changing the text periodically
        const baseText = 'LOADING';
        let dotCount = 0;

        this.time.addEvent({
            delay: 400, // Change every 400ms
            callback: () => {
                dotCount = (dotCount + 1) % 4; // Cycle through 0, 1, 2, 3 dots
                const dots = '.'.repeat(dotCount);
                this.loadingText.setText(baseText + dots);
            },
            loop: true
        });
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

        // Position text so "LOADING..." (max width) appears centered
        // Since origin is (0, 0.5), offset by half the max text width
        const maxText = 'LOADING...';
        this.loadingText.setText(maxText);
        const textWidth = this.loadingText.width;
        this.loadingText.setPosition((width - textWidth) / 2, textY);

        // 5. Show the logo (if it was hidden)
        this.logo.setAlpha(1);
    }

    private startGame() {
        this.scale.off('resize', this.resize, this); // Clean up listener

        // Check for universeId in URL parameters (for debugging)
        const params = new URLSearchParams(window.location.search);
        const universeId = params.get('universeId');

        if (universeId) {
            console.log(`Starting with universe: ${universeId}`);
            this.scene.start('PlanetMapScene', { universeId });
        } else {
            this.scene.start('PlanetMapScene');
        }
    }


    private generateFlares() {
        const colors = {
            'flare-blue': 0x0000ff,
            'flare-green': 0x00ff00,
            'flare-red': 0xff0000,
            'flare-white': 0xffffff,
            'flare-yellow': 0xffff00
        };

        console.log('Generating flare textures...');

        Object.entries(colors).forEach(([key, color]) => {
            createFlareTexture(this, key, color);
        });
    }
}
