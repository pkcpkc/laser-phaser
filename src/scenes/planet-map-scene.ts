import Phaser from 'phaser';
import { WarpStarfield } from '../backgrounds/warp-starfield';
import { PlanetVisuals } from './planet-map/planet-visuals';
import { MapInteractionManager } from './planet-map/map-interaction';
import { BaseUniverse } from './planet-map/base-universe';
import { UniverseFactory } from './planet-map/universe-factory';
import { type PlanetData } from './planet-map/planet-data';
import { GameStatus } from '../logic/game-status';
import { LootUI } from '../ui/loot-ui';

export default class PlanetMapScene extends Phaser.Scene {
    private universe!: BaseUniverse;
    private visuals: PlanetVisuals;
    private interactions!: MapInteractionManager;

    private playerShip!: Phaser.GameObjects.Image;
    private currentPlanetId: string = '';

    private starfield!: WarpStarfield;
    private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
    private lastShipPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

    // Loot UI
    private lootUI!: LootUI;


    constructor() {
        super('PlanetMapScene');
        this.visuals = new PlanetVisuals(this);
    }

    init(data: { universeId?: string, planetId?: string, victory?: boolean }) {
        // Store target planet to move to in create()
        if (data?.planetId) {
            this.currentPlanetId = data.planetId;
        }

        // Store explicit universe to load in create
        if (data?.universeId) {
            this.registry.set('targetUniverseId', data.universeId);
            // Also update currentPlanetId if switching universe implies a default?
            // No, defer to create check.
        }

        // Handle victory warp logic implicitly by ensuring create() loads the right universe
    }



    create() {
        console.log('PlanetMapScene: create() started');
        const { width, height } = this.scale;

        console.log('PlanetMapScene: initializing managers');
        // Initialize Managers
        this.interactions = new MapInteractionManager(this);
        // this.visuals = new PlanetVisuals(this); // Re-assign to ensure scene is valid - REMOVED, already in constructor

        console.log('PlanetMapScene: initializing universe');
        // Initialize Data
        const distinctUniverseId = this.registry.get('targetUniverseId') as string || 'blood-hunters-universe';
        this.universe = UniverseFactory.create(distinctUniverseId);
        this.universe.init(this, width, height);

        // Pass universe ID to interactions
        this.interactions.setUniverseId(this.universe.id);

        console.log('PlanetMapScene: creating background');
        // Background
        this.add.rectangle(0, 0, width, height, 0x000011).setOrigin(0).setDepth(-100);
        this.add.image(width / 2, height / 2, this.universe.backgroundTexture).setAlpha(0.3).setScale(1.5).setDepth(-100);

        console.log('PlanetMapScene: creating starfield');
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

        console.log('PlanetMapScene: creating visuals');
        // Draw Planets
        this.visuals.createVisuals(this.universe.getAll(), this.universe.id, (planet) => this.handlePlanetClick(planet));

        console.log('PlanetMapScene: creating player ship');
        // Create Player Ship
        this.createPlayerShip();
        console.log('PlanetMapScene: Ship created:', this.playerShip);
        console.log('PlanetMapScene: Ship visible:', this.playerShip.visible, 'active:', this.playerShip.active, 'alpha:', this.playerShip.alpha);

        // Start Animations
        // Animations start automatically in visuals

        console.log('PlanetMapScene: updating visibility and moving to planet');
        // Initial State Update
        this.visuals.updateVisibility(this.universe.getAll());

        // Validate currentPlanetId for this universe
        if (!this.universe.getById(this.currentPlanetId)) {
            const planets = this.universe.getAll();
            // Try to find a central planet first, then any visible planet, then default to the first one
            const corePlanet = planets.find(p => p.centralPlanet) || planets.find(p => !p.hidden) || planets[0];

            if (corePlanet) {
                this.currentPlanetId = corePlanet.id;
            }
        }

        this.moveToPlanet(this.currentPlanetId, true);

        // Create Loot UI
        this.lootUI = new LootUI(this);
        this.lootUI.create(100);

        console.log('PlanetMapScene: setting up resize handler');
        // Handle Resize
        this.scale.on('resize', this.handleResize, this);

        console.log('PlanetMapScene: setting up input');
        // Input
        if (this.input.keyboard) {
            this.cursorKeys = this.input.keyboard.createCursorKeys();
        }

        console.log('PlanetMapScene: create() complete');

    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;

        // Update positions in registry
        this.universe.updatePositions(width, height);



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
            .setDepth(10);
        console.log('createPlayerShip: Created at 0,0');
    }



    private isPlanetLocked(planet: PlanetData): boolean {
        const required = planet.requiredVictories ?? 0;
        if (required <= 0) return false;

        const currentWins = GameStatus.getInstance().getVictories(this.universe.id);
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

        if (planet.hidden || planet.hidden === undefined) {
            this.revealPlanet(planet);
        }

        this.interactions.showInteractionUI(planet);
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
    }

    private moveToPlanet(planetId: string, instant: boolean = false) {
        const planet = this.universe.getById(planetId);
        if (!planet) return;

        this.currentPlanetId = planetId;

        const shipX = planet.x - 60;
        const shipY = planet.y;

        if (instant) {
            this.playerShip.setPosition(shipX, shipY);
            // Also show UI if instant move (e.g. initial load or resize)
            this.interactions.showInteractionUI(planet);
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
            const current = this.universe.getById(this.currentPlanetId);
            if (current) this.interactions.launchLevelIfAvailable(current);
        }
    }

    private navigate(dx: number, dy: number) {
        const bestCandidate = this.universe.findNearestNeighbor(this.currentPlanetId, dx, dy);
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
