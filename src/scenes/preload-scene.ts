import Phaser from 'phaser';
// import { BigCruiser } from '../ships/big-cruiser';
// import { BloodHunter } from '../ships/blood-hunter';
// import { GreenRocketCarrier } from '../ships/green-rocket-carrier';
import { createFlareTexture } from '../ships/textures/flares-texture';
// import { getSupportedLocales } from '../config/i18n';
// import { getSupportedLocales } from '../config/i18n';

export default class PreloadScene extends Phaser.Scene {
    private startTime: number = 0;
    private logo!: Phaser.GameObjects.Image;
    private background!: Phaser.GameObjects.Image;
    private androidHead!: Phaser.GameObjects.Image;
    private loadingText!: Phaser.GameObjects.Text;

    constructor() {
        super('PreloadScene');
    }

    init() {
        this.startTime = Date.now();
    }

    preload() {
        const { width, height } = this.scale;

        // 1. Background (loaded in BootScene) - Fades in
        this.background = this.add.image(width / 2, height / 2, 'background');
        this.background.setOrigin(0.5, 0.5);
        this.background.setAlpha(0);
        this.background.setDepth(0);

        // 2. Logo (loaded in BootScene) - Always visible (middle layer)
        this.logo = this.add.image(width / 2, height / 2, 'logo');
        this.logo.setOrigin(0.5, 0.5);
        this.logo.setAlpha(1); // Ensure visible
        this.logo.setDepth(1);

        // 3. Android Head (loaded in BootScene) - Fades in (foreground)
        this.androidHead = this.add.image(width / 2, height / 2, 'android-head');
        this.androidHead.setOrigin(0.5, 0.5);
        this.androidHead.setAlpha(0);
        this.androidHead.setDepth(2);

        // 4. Loading Text
        // Use left origin (0, 0.5) so text doesn't shift when dot count changes
        this.loadingText = this.add.text(0, 0, 'LOADING...', {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);
        this.loadingText.setDepth(10);

        // Animate the dots
        this.animateLoadingDots();

        // Start the visual update loop
        this.startProgressLoop();

        // Initial layout update to ensure correct sizing immediately
        this.updateLayout();

        // Add error handlers for asset loading
        this.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.error('Error loading file:', file.key, file.src);
        });

        this.load.on('progress', (value: number) => {
            // Update real progress, visuals are handled in the loop
            this.realProgress = value;
        });

        this.load.on('filecomplete', (key: string) => {
            console.log('File loaded:', key);
        });

        this.load.on('complete', () => {
            console.log('All assets loaded successfully');
            this.realProgress = 1;
        });

        // Load Game Assets
        // From BaseScene
        this.load.atlas('ships', 'assets/sprites/ships.png', 'assets/sprites/ships.json');
        this.load.image('nebula', 'assets/images/nebula.png');
        this.load.image('nebula', 'assets/images/nebula.png');
        this.load.image('blood_nebula', 'assets/images/blood_nebula.png');


        // Load Data
        // Always load the default storylines.json (which corresponds to 'en' or fallback)
        // this.load.json('storylines', 'assets/storylines/storylines.json'); - REMOVED (Compiled)
    }

    create() {
        console.log('PreloadScene: create started');

        // Generate procedural textures
        this.generateFlares();

        // Listen for resize events
        this.scale.on('resize', this.resize, this);

        console.log('PreloadScene: create complete, waiting for load and fade...');
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
                if (this.loadingText) {
                    this.loadingText.setText(baseText + dots);
                }
            },
            loop: true
        });
    }

    resize() {
        this.updateLayout();
    }

    updateLayout() {
        if (!this.logo || !this.loadingText || !this.background || !this.androidHead) return;

        const width = this.scale.width;
        const height = this.scale.height;

        // 1. Reset scales
        this.logo.setScale(1);
        this.background.setScale(1);
        this.androidHead.setScale(1);

        // 2. Calculate Unified Scale
        // All three images (background, logo, androidHead) are layers of the same composition
        // and MUST have the exact same scale and position.
        // We use the logo as the reference for dimensions (assuming all are same size or logo is main)
        // actually, let's use the background or just one of them.

        // We want to contain the composition within the screen (or cover?)
        // Usually loading screens might cover, but if it's a "logo" it might be contained.
        // Let's use 'contain' (Math.min) to ensure the whole artwork is visible.
        // And we'll base it on the logo's natural size.

        const sourceWidth = this.logo.width;
        const sourceHeight = this.logo.height;

        // Target: 80% width or 60% height max, OR just fit screen? 
        // User "fully visible" implies fit. 
        // Let's stick to the previous constraint for the logo but apply it to ALL.
        const maxLogoWidth = width * 0.8;
        const maxLogoHeight = height * 0.6;

        const scaleX = maxLogoWidth / sourceWidth;
        const scaleY = maxLogoHeight / sourceHeight;
        const uniformScale = Math.min(scaleX, scaleY, 1.0); // Cap at 1.0

        // 3. Apply Uniform Scale and Position
        const centerX = width / 2;
        // Center vertically but maybe slightly up as before
        const centerY = height / 2 - (height * 0.05);

        [this.background, this.logo, this.androidHead].forEach(image => {
            image.setScale(uniformScale);
            image.setPosition(centerX, centerY);
        });

        // 4. Position text below composition
        const compositionHeight = sourceHeight * uniformScale;
        const logoBottom = centerY + (compositionHeight / 2);
        const textY = logoBottom + 40;

        // Position text
        const maxText = 'LOADING...';
        this.loadingText.setText(maxText);
        const textWidth = this.loadingText.width;
        this.loadingText.setPosition((width - textWidth) / 2, textY);

        // 5. Ensure depths
        this.loadingText.setDepth(10);
    }

    private startGame() {
        this.scale.off('resize', this.resize, this); // Clean up listener
        if (this.loadingEvent) this.loadingEvent.destroy();

        // Check for galaxyId in URL parameters (for debugging)
        // Also support legacy 'universeId' parameter for backward compatibility
        const params = new URLSearchParams(window.location.search);
        let galaxyId = params.get('galaxyId') || params.get('universeId');

        // Handle legacy ID format (e.g., 'demo-universe' -> 'demo-galaxy')
        if (galaxyId && galaxyId.endsWith('-universe')) {
            galaxyId = galaxyId.replace('-universe', '-galaxy');
        }

        // Check for God Mode (disable collision except loot)
        const godModeParam = params.get('godMode');
        if (godModeParam === 'true') {
            console.log('God Mode enabled via URL parameter');
            this.registry.set('godMode', true);
        } else {
            this.registry.set('godMode', false);
        }

        const debugParam = params.get('debug');
        if (debugParam === 'planet-effects') {
            console.log('Starting debug scene: PlanetEffectsScene');
            this.scene.start('PlanetEffectsScene');
            return;
        }

        if (galaxyId) {
            console.log(`Starting directly with galaxy: ${galaxyId} (skipping wormhole)`);
            const autoLaunchPlanetId = params.get('autoLaunchPlanetId');
            this.scene.start('GalaxyScene', { galaxyId, autoLaunchPlanetId });
        } else {
            console.log('WormholeScene started');
            this.scene.start('WormholeScene');
        }
    }


    private loadingEvent!: Phaser.Time.TimerEvent;
    private realProgress: number = 0;

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

    private isGameReady: boolean = false;

    private startProgressLoop() {
        // Run frequently for smooth fading
        this.loadingEvent = this.time.addEvent({
            delay: 16, // ~60fps
            callback: () => this.updateProgress(),
            loop: true
        });
    }

    private updateProgress() {
        if (!this.background || !this.androidHead) return;

        const maxDuration = 3000;
        const elapsed = Date.now() - this.startTime;
        const timeProgress = Math.min(elapsed / maxDuration, 1);

        // Visual progress is limited by BOTH real loading and time
        // If loading is fast (real=1), we fade over time (follows timeProgress)
        // If loading is slow (real=0.1), we wait for it (follows realProgress)
        const visualProgress = Math.min(this.realProgress, timeProgress);

        this.background.setAlpha(visualProgress);
        this.androidHead.setAlpha(visualProgress);

        if (visualProgress >= 1 && !this.isGameReady) {
            this.isGameReady = true;
            // Wait 3s after fully visible before starting
            this.time.delayedCall(3000, () => {
                this.startGame();
            });
        }
    }
}
