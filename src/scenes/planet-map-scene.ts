import Phaser from 'phaser';
import { WarpStarfield } from '../backgrounds/warp-starfield';
import { PlanetRegistry, type PlanetData } from './planet-map/planet-registry';
import { PlanetVisuals } from './planet-map/planet-visuals';
import { MapInteractionManager } from './planet-map/map-interaction';

export default class PlanetMapScene extends Phaser.Scene {
    private planetRegistry: PlanetRegistry;
    private visuals: PlanetVisuals;
    private interactions!: MapInteractionManager;

    private playerShip!: Phaser.GameObjects.Image;
    private currentPlanetId: string = 'earth';

    private starfield!: WarpStarfield;
    private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super('PlanetMapScene');
        this.planetRegistry = new PlanetRegistry();
        this.visuals = new PlanetVisuals(this);
    }

    create() {
        console.log('PlanetMapScene: create() started');
        const { width, height } = this.scale;

        console.log('PlanetMapScene: initializing managers');
        // Initialize Managers
        this.interactions = new MapInteractionManager(this);
        this.visuals = new PlanetVisuals(this); // Re-assign to ensure scene is valid

        console.log('PlanetMapScene: creating background');
        // Background
        this.add.rectangle(0, 0, width, height, 0x000011).setOrigin(0).setDepth(-100);
        this.add.image(width / 2, height / 2, 'backgrounds', 'nebula').setAlpha(0.3).setScale(1.5).setDepth(-100);

        console.log('PlanetMapScene: creating starfield');
        // Starfield Effect
        this.starfield = new WarpStarfield(this, width, height);

        console.log('PlanetMapScene: initializing planets');
        // Initialize Data
        this.planetRegistry.initPlanets(width, height);

        // Draw Connections


        console.log('PlanetMapScene: creating visuals');
        // Draw Planets
        this.visuals.createVisuals(this.planetRegistry.getAll(), (planet) => this.handlePlanetClick(planet));

        console.log('PlanetMapScene: creating player ship');
        // Create Player Ship
        this.createPlayerShip();

        // Start Animations
        // Animations start automatically in visuals

        console.log('PlanetMapScene: updating visibility and moving to planet');
        // Initial State Update
        this.visuals.updateVisibility(this.planetRegistry.getAll());
        this.moveToPlanet(this.currentPlanetId, true);

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
        this.planetRegistry.updatePositions(width, height);



        // Move ship if needed
        this.moveToPlanet(this.currentPlanetId, true);

        // Resize Starfield
        if (this.starfield) {
            this.starfield.resize(width, height);
        }
    }



    private createPlayerShip() {
        this.playerShip = this.add.image(0, 0, 'ships', 'big-cruiser')
            .setScale(0.4)
            .setAngle(-90)
            .setOrigin(0.5)
            .setDepth(10);
    }

    private handlePlanetClick(planet: PlanetData) {
        if (this.currentPlanetId === planet.id) {
            this.interactions.showInteractionUI(planet);
            return;
        }
        this.travelToPlanet(planet);
    }

    private travelToPlanet(target: PlanetData) {
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

        if (!planet.unlocked) {
            this.unlockPlanet(planet);
        }

        this.interactions.showInteractionUI(planet);
    }

    private unlockPlanet(planet: PlanetData) {
        planet.unlocked = true;

        // Stop the particle effect
        if (planet.emitter) {
            planet.emitter.destroy();
            planet.emitter = undefined;
        }

        // Reveal the planet visual
        this.visuals.updateVisibility([planet]);
    }

    private moveToPlanet(planetId: string, instant: boolean = false) {
        const planet = this.planetRegistry.getById(planetId);
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
            const current = this.planetRegistry.getById(this.currentPlanetId);
            if (current) this.interactions.launchLevelIfAvailable(current);
        }
    }

    private navigate(dx: number, dy: number) {
        const bestCandidate = this.planetRegistry.findNearestNeighbor(this.currentPlanetId, dx, dy);
        if (bestCandidate) {
            this.travelToPlanet(bestCandidate);
        }
    }

    update(time: number, delta: number) {
        this.handleInput();
        this.visuals.update(time, delta);
    }
}
