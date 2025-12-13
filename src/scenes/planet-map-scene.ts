import Phaser from 'phaser';
import { WarpStarfield } from '../backgrounds/warp-starfield';

interface PlanetData {
    id: string;
    x: number;
    y: number;
    type: 'main' | 'moon' | 'planet';
    name: string;
    unlocked: boolean;
    connections: string[];
    visualType?: 'emoji' | 'sprite'; // Default to emoji
    visual: string; // The emoji char or asset key
    visualScale?: number;
    levelId?: string;
    hasTrader?: boolean;
    hasShipyard?: boolean;
    // Runtime references
    gameObject?: Phaser.GameObjects.Text | Phaser.GameObjects.Image; // Can be Text or Image
    emitter?: Phaser.GameObjects.Particles.ParticleEmitter; // Particle effect for locked state
}

export default class PlanetMapScene extends Phaser.Scene {
    private planets: PlanetData[] = [];
    private playerShip!: Phaser.GameObjects.Image;
    private currentPlanetId: string = 'earth';
    private connectionGraphics!: Phaser.GameObjects.Graphics;
    private starfield!: WarpStarfield;

    // UI Containers
    private interactionContainer!: Phaser.GameObjects.Container;
    private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super('PlanetMapScene');
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(0, 0, width, height, 0x000011).setOrigin(0).setDepth(-100);
        this.add.image(width / 2, height / 2, 'nebula').setAlpha(0.3).setScale(1.5).setDepth(-100);

        // Starfield Effect
        this.starfield = new WarpStarfield(this, width, height);

        // Initialize Data
        this.initPlanets(width, height);

        // Draw Connections
        this.connectionGraphics = this.add.graphics();
        this.connectionGraphics.setDepth(-50);
        this.drawConnections();

        // Draw Planets
        this.createPlanetVisuals();

        // Create Player Ship
        this.createPlayerShip();

        // Interaction UI
        this.createInteractionUI();

        // Start Animations
        this.startAnimations();

        // Initial State Update
        this.updateVisibility();
        this.moveToPlanet(this.currentPlanetId, true);

        // Handle Resize
        this.scale.on('resize', this.handleResize, this);

        // Input
        if (this.input.keyboard) {
            this.cursorKeys = this.input.keyboard.createCursorKeys();
        }
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;

        // Re-calculate planet positions using the new size
        // We reuse initPlanets logic but need to apply it to existing objects
        const cx = width / 2;
        const earthY = height * 0.8;
        const moonY = height * 0.2;
        const safeTop = 150; // Increased safety margin
        const safeBottom = height - 100;

        const finalEarthY = Math.min(safeBottom, earthY);
        const finalMoonY = Math.max(safeTop, moonY);

        // Update positions
        const earth = this.planets.find(p => p.id === 'earth');
        if (earth) {
            earth.x = cx;
            earth.y = finalEarthY;
            if (earth.gameObject) earth.gameObject.setPosition(cx, finalEarthY);
        }

        const moon = this.planets.find(p => p.id === 'moon-base');
        if (moon) {
            moon.x = cx;
            moon.y = finalMoonY;
            if (moon.gameObject) {
                moon.gameObject.setPosition(cx, finalMoonY);
                // Move particle emitter if exists
                if (moon.emitter) {
                    // Emitter follows gameObject automatically if set to follow?
                    // Yes, we used 'follow: planet.gameObject'
                }
            }
        }

        // Redraw connections
        this.drawConnections();

        // Move ship if needed (or just keep it relative, but simple setPosition helps)
        this.moveToPlanet(this.currentPlanetId, true);

        // Resize Starfield
        if (this.starfield) {
            this.starfield.resize(width, height);
        }
    }

    private initPlanets(width: number, height: number) {
        const cx = width / 2;

        // Use proportional spacing to ensure visibility
        const earthY = height * 0.8;
        const moonY = height * 0.2;

        // Ensure minimum padding from edges
        const safeTop = 150; // Increased safety margin
        const safeBottom = height - 100;

        const finalEarthY = Math.min(safeBottom, earthY);
        const finalMoonY = Math.max(safeTop, moonY);

        this.planets = [
            {
                id: 'earth',
                x: cx,
                y: finalEarthY,
                type: 'main',
                name: 'Earth',
                unlocked: true,
                connections: ['moon-base'],
                visual: '🌍',
                // Removed levelId for Earth so no play button appears (handled in logic too)
            },
            {
                id: 'moon-base',
                x: cx,
                y: finalMoonY,
                type: 'moon',
                name: 'Dark Moon',
                unlocked: false, // Hidden initially
                connections: ['earth'],
                visual: '🌑',
                levelId: 'blood-hunters',
                hasTrader: true,
                hasShipyard: true
            }
        ];
    }

    private drawConnections() {
        this.connectionGraphics.clear();
        this.connectionGraphics.lineStyle(4, 0x4444ff, 0.3);

        this.planets.forEach(planet => {
            planet.connections.forEach(targetId => {
                const target = this.planets.find(p => p.id === targetId);
                if (target) {
                    this.connectionGraphics.moveTo(planet.x, planet.y);
                    this.connectionGraphics.lineTo(target.x, target.y);
                }
            });
        });
    }

    private createPlanetVisuals() {
        this.planets.forEach(planet => {
            let visualObject: Phaser.GameObjects.Text | Phaser.GameObjects.Image;

            if (planet.visualType === 'sprite') {
                visualObject = this.add.image(planet.x, planet.y, planet.visual);
                if (planet.visualScale) {
                    visualObject.setScale(planet.visualScale * 0.75); // Reduced scale (was 1.5)
                }
            } else {
                visualObject = this.add.text(planet.x, planet.y, planet.visual, {
                    fontSize: '48px', // Halved from 96px
                    padding: { x: 10, y: 10 } // Add padding to prevent emoji clipping
                }).setOrigin(0.5);
            }

            visualObject.setInteractive({ useHandCursor: true });
            visualObject.on('pointerdown', () => this.handlePlanetClick(planet));

            planet.gameObject = visualObject;

            // Persistent particle effect for locked planets
            if (!planet.unlocked) {
                this.addLockedParticleEffect(planet);
            }
        });
    }

    private addLockedParticleEffect(planet: PlanetData) {
        if (planet.emitter) return;

        // Use 'flare-white' effectively identical to loot box
        planet.emitter = this.add.particles(0, 0, 'flare-white', {
            color: [0xffffff],
            lifespan: 1000,
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0 }, // Reduced scale for smaller planets
            speed: { min: 10, max: 30 }, // Slower, consistent speed like loot
            blendMode: 'ADD',
            frequency: 100
        });
        if (planet.gameObject) {
            planet.emitter.startFollow(planet.gameObject, 0, -7); // Offset 7px higher (adjusted from 10)
        }
        planet.emitter.setDepth(1);
    }


    private createPlayerShip() {
        this.playerShip = this.add.image(0, 0, 'big-cruiser')
            .setScale(0.4) // Doubled from 0.2
            .setAngle(-90) // Face up
            .setOrigin(0.5)
            .setDepth(10);


    }



    private createInteractionUI() {
        this.interactionContainer = this.add.container(0, 0);
        this.interactionContainer.setVisible(false);
        this.interactionContainer.setDepth(100);
    }

    private handlePlanetClick(planet: PlanetData) {
        if (this.currentPlanetId === planet.id) {
            this.showInteractionUI(planet);
            return;
        }

        const currentPlanet = this.planets.find(p => p.id === this.currentPlanetId);
        if (currentPlanet && currentPlanet.connections.includes(planet.id)) {
            this.travelToPlanet(planet);
        }
    }

    private travelToPlanet(target: PlanetData) {
        this.interactionContainer.setVisible(false);

        const targetX = target.x - 60;
        const targetY = target.y;

        // Calculate angle to target
        const targetRotation = Phaser.Math.Angle.Between(
            this.playerShip.x,
            this.playerShip.y,
            targetX,
            targetY
        );



        // 1. Rotation Tween (Slower)
        this.tweens.add({
            targets: this.playerShip,
            rotation: targetRotation,
            duration: 500, // Slower smoothed rotation
            ease: 'Power2'
        });

        // 2. Movement Tween
        this.tweens.add({
            targets: this.playerShip,
            x: targetX,
            y: targetY,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                this.arriveAtPlanet(target);
            }
        });
    }

    private arriveAtPlanet(planet: PlanetData) {
        this.currentPlanetId = planet.id;



        if (!planet.unlocked) {
            this.unlockPlanet(planet);
        }

        this.showInteractionUI(planet);
    }

    private unlockPlanet(planet: PlanetData) {
        planet.unlocked = true;

        // Stop the particle effect
        if (planet.emitter) {
            planet.emitter.destroy();
            planet.emitter = undefined;
        }

        // Only flash the object, no extra burst (as arguably requested "not at the moment they are discovered")
        if (planet.gameObject) {
            this.tweens.add({
                targets: planet.gameObject,
                alpha: 0,
                yoyo: true,
                repeat: 3,
                duration: 100
            });
        }

        this.updateVisibility();
    }

    private updateVisibility() {
        this.planets.forEach(planet => {
            if (!planet.gameObject) return;

            if (planet.unlocked) {
                planet.gameObject.setAlpha(1);
                if (planet.gameObject instanceof Phaser.GameObjects.Text && planet.id === 'earth') {
                    planet.gameObject.setText('🌍');
                }
            } else {
                planet.gameObject.setAlpha(0.8);
            }
        });
    }

    private moveToPlanet(planetId: string, instant: boolean = false) {
        const planet = this.planets.find(p => p.id === planetId);
        if (!planet) return;

        this.currentPlanetId = planetId;

        const shipX = planet.x - 60;
        const shipY = planet.y;

        if (instant) {
            this.playerShip.setPosition(shipX, shipY);
            this.showInteractionUI(planet);
        }
    }

    private showInteractionUI(planet: PlanetData) {
        this.interactionContainer.removeAll(true);

        // No icons for main planet (Earth)
        if (planet.type === 'main') {
            this.interactionContainer.setVisible(false);
            return;
        }

        // Position - to the right of the planet
        this.interactionContainer.setPosition(planet.x + 60, planet.y);
        this.interactionContainer.setVisible(true);

        const icons: Phaser.GameObjects.Text[] = [];

        if (planet.levelId) {
            const playBtn = this.add.text(0, 0, '▶️', { fontSize: '24px', padding: { x: 5, y: 5 } })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.launchLevel(planet.levelId!));
            icons.push(playBtn);
        }

        if (planet.hasTrader) {
            const traderBtn = this.add.text(0, 0, '💰', { fontSize: '24px', padding: { x: 5, y: 5 } })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.start('TraderScene'));
            icons.push(traderBtn);
        }

        if (planet.hasShipyard) {
            const shipyardBtn = this.add.text(0, 0, '🛠️', { fontSize: '24px', padding: { x: 5, y: 5 } })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.start('ShipyardScene'));
            icons.push(shipyardBtn);
        }

        // Vertical Stack Layout
        const spacing = 35; // Increased spacing for larger icons
        const totalHeight = (icons.length - 1) * spacing;
        const startY = -totalHeight / 2;

        icons.forEach((icon, index) => {
            icon.setPosition(0, startY + (index * spacing));
            this.interactionContainer.add(icon);
        });
    }

    private launchLevel(levelId: string) {
        if (levelId === 'blood-hunters') {
            this.scene.start('BloodHunters');
        } else {
            console.warn('Level not implemented:', levelId);
        }
    }

    private startAnimations() {
        // Earth Rotation Animation: 🌍 🌏 🌎 ...
        const earthFrames = ['🌍', '🌏', '🌎'];
        let earthFrameIdx = 0;

        // Moon Phases: 🌕 🌖 🌗 🌘 🌑 🌒 🌓 🌔
        const moonFrames = ['🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔'];
        let moonFrameIdx = 0;

        this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                // Earth
                const earth = this.planets.find(p => p.id === 'earth');
                if (earth && earth.gameObject && earth.gameObject instanceof Phaser.GameObjects.Text) {
                    earthFrameIdx = (earthFrameIdx + 1) % earthFrames.length;
                    earth.gameObject.setText(earthFrames[earthFrameIdx]);
                }

                // Moon
                const moon = this.planets.find(p => p.id === 'moon-base');
                if (moon && moon.gameObject && moon.gameObject instanceof Phaser.GameObjects.Text) {
                    if (moon.unlocked) {
                        moonFrameIdx = (moonFrameIdx + 1) % moonFrames.length;
                        moon.gameObject.setText(moonFrames[moonFrameIdx]);
                    } else {
                        moon.gameObject.setText('🌑');
                    }
                }
            }
        });
    }

    private handleInput() {
        if (!this.cursorKeys) return;

        // Debounce input slightly or key repeat might be fast, but finding planet is cheap
        // Using JustDown to prevent constant re-triggering while moving
        if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.up)) {
            this.navigate(0, -1);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.down)) {
            this.navigate(0, 1);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.left)) {
            this.navigate(-1, 0);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.right)) {
            this.navigate(1, 0);
        }
    }

    private navigate(dx: number, dy: number) {
        const currentPlanet = this.planets.find(p => p.id === this.currentPlanetId);
        if (!currentPlanet) return;

        // Find connected planets
        const neighbors = currentPlanet.connections
            .map(id => this.planets.find(p => p.id === id))
            .filter((p): p is PlanetData => !!p);

        // Find best match in direction
        let bestCandidate: PlanetData | null = null;
        let bestDistance = Infinity;

        neighbors.forEach(neighbor => {
            const relX = neighbor.x - currentPlanet.x;
            const relY = neighbor.y - currentPlanet.y;

            // Check primary direction
            if (dx !== 0) {
                // Horizontal movement requested
                if ((dx > 0 && relX > 10) || (dx < 0 && relX < -10)) {
                    const dist = Math.abs(relX) + Math.abs(relY) * 0.5;
                    if (dist < bestDistance) {
                        bestDistance = dist;
                        bestCandidate = neighbor;
                    }
                }
            } else if (dy !== 0) {
                // Vertical movement requested
                if ((dy > 0 && relY > 10) || (dy < 0 && relY < -10)) {
                    const dist = Math.abs(relY) + Math.abs(relX) * 0.5;
                    if (dist < bestDistance) {
                        bestDistance = dist;
                        bestCandidate = neighbor;
                    }
                }
            }
        });

        if (bestCandidate) {
            this.handlePlanetClick(bestCandidate);
        }
    }

    update(_time: number, _delta: number) {


        this.handleInput();
    }
}
