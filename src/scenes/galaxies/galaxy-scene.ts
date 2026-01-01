import Phaser from 'phaser';
import { WarpStarfield } from '../../backgrounds/warp-starfield';
import { PlanetVisuals } from './planets/planet-visuals';
import { GalaxyInteractionManager } from './galaxy-interaction';
import { Galaxy } from './galaxy';
import { GalaxyFactory } from './galaxy-factory';
import { type PlanetData } from './planets/planet-data';
import { GameStatus } from '../../logic/game-status';
import { LootUI } from '../../ui/loot-ui';
import { setupDebugKey } from '../../logic/debug-utils';
import { PlanetIntroOverlay } from './planets/planet-intro-overlay';
import { StorylineManager } from '../../logic/storyline-manager';

export default class GalaxyScene extends Phaser.Scene {
    private galaxy!: Galaxy;
    private visuals: PlanetVisuals;
    private interactions!: GalaxyInteractionManager;

    private playerShip!: Phaser.GameObjects.Image;
    private currentPlanetId: string = '';

    private starfield!: WarpStarfield;
    private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
    private lastShipPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

    // Loot UI
    private lootUI!: LootUI;
    private introOverlay!: PlanetIntroOverlay;


    constructor() {
        super('GalaxyScene');
        this.visuals = new PlanetVisuals(this);
    }

    init(data: { galaxyId?: string, planetId?: string, victory?: boolean }) {
        // Store target planet to move to in create()
        if (data?.planetId) {
            this.currentPlanetId = data.planetId;
        }

        // Store explicit galaxy to load in create
        if (data?.galaxyId) {
            this.registry.set('targetGalaxyId', data.galaxyId);
            // Also update currentPlanetId if switching universe implies a default?
            // No, defer to create check.
        }

        // Handle victory warp logic implicitly by ensuring create() loads the right galaxy
    }



    create() {
        console.log('GalaxyScene: create() started');
        const { width, height } = this.scale;

        console.log('GalaxyScene: initializing managers');
        // Initialize Managers
        this.interactions = new GalaxyInteractionManager(this);

        // Initialize Storyline Manager
        if (this.cache.text.exists('storylines')) {
            const manager = StorylineManager.getInstance();
            if (!manager.initialized) {
                manager.init(this.cache.text.get('storylines'));
            }
        } else {
            console.warn('Storylines data not found in cache.');
        }

        // this.visuals = new PlanetVisuals(this); // Re-assign to ensure scene is valid - REMOVED, already in constructor

        console.log('GalaxyScene: initializing Galaxy');
        // Initialize Data
        const distinctGalaxyId = this.registry.get('targetGalaxyId') as string || 'blood-hunters-galaxy';
        this.galaxy = GalaxyFactory.create(distinctGalaxyId);
        this.galaxy.init(this, width, height);

        // Pass galaxy ID to interactions
        this.interactions.setGalaxyId(this.galaxy.id);
        this.interactions.setStorylineCallback((planet) => this.showStoryline(planet));

        console.log('GalaxyScene: creating background');
        // Background
        this.add.rectangle(0, 0, width, height, 0x000011).setOrigin(0).setDepth(-100);
        this.add.image(width / 2, height / 2, this.galaxy.backgroundTexture).setAlpha(0.3).setScale(1.5).setDepth(-100);

        console.log('GalaxyScene: creating starfield');
        // Starfield Effect
        this.starfield = new WarpStarfield(this, width, height);
        console.log('Starfield initialized');

        // Check for warp condition from previous scene (Victory)
        // We do this here after universe is loaded so we can access planet data if needed, 
        // though simpler is just checking the passed data if we had it.
        // But for parity with original intent:
        // if (data.victory ... ) - we don't have 'data' here easily unless we stored it.
        // Assuming the 'init' logic for warp was intended to verify the warp. 
        // If the previous scene sent 'warpUniverseId' directly it would be easier.

        console.log('GalaxyScene: creating visuals');
        // Draw Planets
        this.visuals.createVisuals(this.galaxy.getAll(), this.galaxy.id, (planet) => this.handlePlanetClick(planet));

        console.log('GalaxyScene: creating player ship');
        // Create Player Ship
        this.createPlayerShip();
        console.log('GalaxyScene: Ship created:', this.playerShip);
        console.log('GalaxyScene: Ship visible:', this.playerShip.visible, 'active:', this.playerShip.active, 'alpha:', this.playerShip.alpha);

        // Start Animations
        // Animations start automatically in visuals

        console.log('GalaxyScene: updating visibility and moving to planet');
        // Initial State Update
        this.visuals.updateVisibility(this.galaxy.getAll());

        // Validate currentPlanetId for this galaxy
        if (!this.galaxy.getById(this.currentPlanetId)) {
            const planets = this.galaxy.getAll();
            // Try to find a central planet first, then any visible planet, then default to the first one
            const corePlanet = planets.find(p => p.centralPlanet) || planets.find(p => !p.hidden) || planets[0];

            if (corePlanet) {
                this.currentPlanetId = corePlanet.id;
            }
        }

        // Create Loot UI
        this.lootUI = new LootUI(this);
        this.lootUI.create(100);

        this.introOverlay = new PlanetIntroOverlay(this);

        this.moveToPlanet(this.currentPlanetId, true);

        console.log('GalaxyScene: setting up resize handler');
        // Handle Resize
        this.scale.on('resize', this.handleResize, this);

        console.log('GalaxyScene: setting up input');
        // Input
        if (this.input.keyboard) {
            this.cursorKeys = this.input.keyboard.createCursorKeys();
        }

        console.log('GalaxyScene: create() complete');

        // Debug Mode
        setupDebugKey(this);
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;

        // Update positions in registry
        this.galaxy.updatePositions(width, height);



        // Move ship if needed
        this.moveToPlanet(this.currentPlanetId, true);

        // Resize Starfield
        if (this.starfield) {
            this.starfield.resize(width, height);
        }

        // Update Loot UI positions
        if (this.lootUI) {
            this.lootUI.updatePositions();
        }
    }

    private createPlayerShip() {
        this.playerShip = this.add.image(0, 0, 'ships', 'big-cruiser')
            .setScale(0.4)
            .setAngle(-90)
            .setOrigin(0.5)
            .setDepth(1000);
        console.log('createPlayerShip: Created at 0,0');
    }



    private isPlanetLocked(planet: PlanetData): boolean {
        const required = planet.requiredVictories ?? 0;
        if (required <= 0) return false;

        const currentWins = GameStatus.getInstance().getVictories(this.galaxy.id);
        return currentWins < required;
    }

    private handlePlanetClick(planet: PlanetData) {
        if (this.isPlanetLocked(planet)) {
            // Optional: Shake effect or sound to indicate locked?
            // For now just block.
            return;
        }

        if (this.currentPlanetId === planet.id) {
            this.interactions.showInteractionUI(planet);
            return;
        }
        this.travelToPlanet(planet);
    }

    private travelToPlanet(target: PlanetData) {
        // Safety check, though callers should handle it
        if (this.isPlanetLocked(target)) return;

        this.interactions.hide();

        const targetX = target.x - 60;
        const targetY = target.y;

        // Calculate angle to target
        const targetRotation = Phaser.Math.Angle.Between(
            this.playerShip.x,
            this.playerShip.y,
            targetX,
            targetY
        );

        // Shortest angle interpolation
        let diff = targetRotation - this.playerShip.rotation;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;

        const finalRotation = this.playerShip.rotation + diff;

        // 1. Rotation Tween
        this.tweens.add({
            targets: this.playerShip,
            rotation: finalRotation,
            duration: 500,
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

        const isHidden = planet.hidden || planet.hidden === undefined;
        if (isHidden) {
            this.revealPlanet(planet);
            return; // revealPlanet handles the rest
        }

        const introStarted = this.checkAndShowIntro(planet);
        if (!introStarted) {
            this.interactions.showInteractionUI(planet);
        }
    }

    private checkAndShowIntro(planet: PlanetData) {
        const gameStatus = GameStatus.getInstance();

        // Show if:
        // Show if:
        // 1. Has intro text available in StorylineManager
        // 2. Not seen yet

        const introText = StorylineManager.getInstance().getIntroText(this.galaxy.id, planet.id);

        if (introText && !gameStatus.hasSeenIntro(planet.id)) {
            // Pause interactions? The overlay covers everything so clicks are blocked.
            // We might want to hide loot UI or others?
            if (this.lootUI) this.lootUI.setVisible(false);
            this.interactions.hide();

            this.introOverlay.show(planet, introText, () => {
                gameStatus.markIntroSeen(planet.id);
                if (this.lootUI) this.lootUI.setVisible(true);
                this.interactions.showInteractionUI(planet);
            });
            return true;
        }
        return false;
    }

    private showStoryline(planet: PlanetData) {
        const introText = StorylineManager.getInstance().getIntroText(this.galaxy.id, planet.id);
        if (!introText) return;

        if (this.lootUI) this.lootUI.setVisible(false);
        this.interactions.hide();

        this.introOverlay.show(planet, introText, () => {
            if (this.lootUI) this.lootUI.setVisible(true);
            this.interactions.showInteractionUI(planet);
        });
    }

    private revealPlanet(planet: PlanetData) {
        planet.hidden = false;
        GameStatus.getInstance().revealPlanet(planet.id);

        // Stop the particle effect
        if (planet.emitter) {
            planet.emitter.destroy();
            planet.emitter = undefined;
        }

        // Reveal the planet visual
        this.visuals.updateVisibility([planet]);

        // Check for intro upon reveal
        const introStarted = this.checkAndShowIntro(planet);

        if (!introStarted) {
            this.interactions.showInteractionUI(planet);
        }
    }

    private moveToPlanet(planetId: string, instant: boolean = false) {
        const planet = this.galaxy.getById(planetId);
        if (!planet) return;

        this.currentPlanetId = planetId;

        const shipX = planet.x - 60;
        const shipY = planet.y;

        if (instant) {
            this.playerShip.setPosition(shipX, shipY);
            // Check for intro trigger on instant move (e.g. initial start)
            const introStarted = this.checkAndShowIntro(planet);

            if (!introStarted) {
                this.interactions.showInteractionUI(planet);
            }
        }
    }

    private handleInput() {
        if (!this.cursorKeys) return;

        if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.up)) {
            this.navigate(0, -1);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.down)) {
            this.navigate(0, 1);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.left)) {
            this.navigate(-1, 0);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.right)) {
            this.navigate(1, 0);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.space)) {
            const current = this.galaxy.getById(this.currentPlanetId);
            if (current) this.interactions.launchLevelIfAvailable(current);
        }
    }

    private navigate(dx: number, dy: number) {
        const bestCandidate = this.galaxy.findNearestNeighbor(this.currentPlanetId, dx, dy);
        if (bestCandidate && !this.isPlanetLocked(bestCandidate)) {
            this.travelToPlanet(bestCandidate);
        }
    }

    update(time: number, delta: number) {
        this.handleInput();
        this.visuals.update(time, delta);

        // Calculate ship speed for starfield effect
        if (this.playerShip && this.starfield) {
            const currentPos = new Phaser.Math.Vector2(this.playerShip.x, this.playerShip.y);

            // Distance moved this frame
            const dist = currentPos.distance(this.lastShipPos);

            // Pixels per second
            const speedPxPerSec = (dist / delta) * 1000;

            // Normalize speed to a factor (e.g., max expected speed is ~500px/s?)
            // If speed is 0, factor is 0.
            const speedFactor = Phaser.Math.Clamp(speedPxPerSec / 500, 0, 5);

            // Smooth the transition if needed, but direct mapping might feel more responsive
            this.starfield.setSpeed(speedFactor);

            this.lastShipPos.copy(currentPos);
        }
    }
}
