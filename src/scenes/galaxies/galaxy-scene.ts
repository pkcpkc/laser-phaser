import Phaser from 'phaser';
import { container, bindScene } from '../../di/container';

import { Galaxy } from './galaxy';
import { GalaxyFactory } from './galaxy-factory';
import { LocaleManager } from '../../config/locale-manager';
import type { IPlanetVisuals, IGalaxyInteractionManager, IPlayerShipController, IPlanetNavigator, IWarpStarfield } from '../../di/interfaces/galaxy';
import type { ILootUI } from '../../di/interfaces/ui-effects';

import { PlanetVisuals } from './planets/planet-visuals';
import { GalaxyInteractionManager } from './galaxy-interaction';
import { PlayerShipController } from './player-ship-controller';
import { LootUI } from '../../ui/loot-ui';
import { WarpStarfield } from '../../backgrounds/warp-starfield';
import { PlanetNavigator } from './planet-navigator';

export default class GalaxyScene extends Phaser.Scene {
    private galaxy!: Galaxy;
    private visuals!: IPlanetVisuals;
    private interactions!: IGalaxyInteractionManager;
    private shipController!: IPlayerShipController;
    private navigator!: IPlanetNavigator;
    private starfield!: IWarpStarfield;
    private lootUI!: ILootUI;

    private autoStartLevel: boolean = false;
    private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
    private lastShipPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

    constructor() {
        super('GalaxyScene');
    }

    init(data: { galaxyId?: string, planetId?: string, victory?: boolean, autoStart?: boolean }) {
        if (data?.planetId) {
            this.registry.set('initialPlanetId', data.planetId);
            this.autoStartLevel = data.autoStart ?? false;
        }

        if (data?.galaxyId) {
            this.registry.set('targetGalaxyId', data.galaxyId);
        }

        if (data?.victory) {
            this.registry.set('justWonLevel', true);
        } else {
            this.registry.set('justWonLevel', false);
        }
    }

    create() {
        const { width, height } = this.scale;

        // Bind this scene to the container
        bindScene(this);

        // Detect locale
        const locale = LocaleManager.getInstance().detectLocale(this.registry);

        try {
            // Resolve dependencies from container
            this.visuals = container.get<IPlanetVisuals>(PlanetVisuals);
            this.interactions = container.get<IGalaxyInteractionManager>(GalaxyInteractionManager);
            this.shipController = container.get<IPlayerShipController>(PlayerShipController);
            this.lootUI = container.get<ILootUI>(LootUI);
            this.starfield = container.get<IWarpStarfield>(WarpStarfield);
            this.navigator = container.get<IPlanetNavigator>(PlanetNavigator);

            // Initialize Galaxy
            const distinctGalaxyId = this.registry.get('targetGalaxyId') as string || 'blood-hunters-galaxy';
            this.galaxy = GalaxyFactory.create(distinctGalaxyId);
            this.galaxy.init(this, width, height);
            console.log(`GalaxyScene: create() started for ${distinctGalaxyId}`);
        } catch (e) {
            console.error('GalaxyScene: Failed to resolve dependencies or init galaxy', e);
            throw e;
        }

        // Configure Navigator
        if ('config' in this.navigator) {
            (this.navigator as any).config(this.galaxy, locale);
        }

        // Configure LootUI
        this.lootUI.create(100);

        // Configure interactions
        this.interactions.setGalaxyId(this.galaxy.id);
        this.interactions.setStorylineCallback((planet) => this.navigator.showStoryline(planet));

        // Background
        this.add.rectangle(0, 0, width, height, 0x000011).setOrigin(0).setDepth(-100);
        this.add.image(width / 2, height / 2, this.galaxy.backgroundTexture).setAlpha(0.3).setScale(1.5).setDepth(-100);

        // Starfield Effect (Already instantiated via container)

        // Draw Planets
        this.visuals.createVisuals(this.galaxy.getAll(), this.galaxy.id, (planet) => this.navigator.handlePlanetClick(planet));

        // Create Player Ship
        this.shipController.create();

        // Initial State (No forced call to animate needed as symbols are set in createVisuals)
        this.visuals.updateVisibility(this.galaxy.getAll());



        // Validate and set initial planet
        const initialPlanetId = this.registry.get('initialPlanetId') as string;
        let currentPlanetId = initialPlanetId;

        if (!this.galaxy.getById(currentPlanetId)) {
            const planets = this.galaxy.getAll();
            const corePlanet = planets.find(p => p.centralPlanet) || planets.find(p => !p.hidden) || planets[0];
            if (corePlanet) {
                currentPlanetId = corePlanet.id;
            }
        }

        // Move to initial planet
        this.navigator.moveToPlanet(currentPlanetId, true, this.autoStartLevel ? 0 : 1500);

        if (this.autoStartLevel) {
            const planet = this.galaxy.getById(currentPlanetId);
            if (planet) {
                console.log(`Auto-starting level for planet: ${currentPlanetId}`);
                this.interactions.launchLevelIfAvailable(planet);
            }
        }

        // Handle Resize
        this.scale.on('resize', this.handleResize, this);

        // Input
        if (this.input.keyboard) {
            this.cursorKeys = this.input.keyboard.createCursorKeys();
        }

        console.log('GalaxyScene: create() complete');
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;

        this.galaxy.updatePositions(width, height);

        const currentPlanetId = this.navigator.getCurrentPlanetId();
        this.navigator.moveToPlanet(currentPlanetId, true);

        if (this.starfield) {
            this.starfield.resize(width, height);
        }

        if (this.lootUI) {
            this.lootUI.updatePositions();
        }
    }

    private handleInput() {
        if (!this.navigator.areControlsEnabled()) return;
        if (!this.cursorKeys) return;

        if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.up)) {
            this.navigator.navigate(0, -1);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.down)) {
            this.navigator.navigate(0, 1);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.left)) {
            this.navigator.navigate(-1, 0);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.right)) {
            this.navigator.navigate(1, 0);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.space)) {
            const currentPlanetId = this.navigator.getCurrentPlanetId();
            const current = this.galaxy.getById(currentPlanetId);
            if (current) this.interactions.launchLevelIfAvailable(current);
        }
    }

    private updateLogged = false;

    update(time: number, delta: number) {
        if (!this.updateLogged) {
            console.log('GalaxyScene: update loop active');
            this.updateLogged = true;
        }

        this.handleInput();
        this.visuals.update(time, delta);

        // Calculate ship speed for starfield effect
        const ship = this.shipController.getShip();
        if (ship && this.starfield) {
            const currentPos = new Phaser.Math.Vector2(ship.x, ship.y);
            const dist = currentPos.distance(this.lastShipPos);
            const speedPxPerSec = (dist / delta) * 1000;
            const speedFactor = Phaser.Math.Clamp(speedPxPerSec / 500, 0, 5);
            this.starfield.setSpeed(speedFactor);
            this.lastShipPos.copy(currentPos);
        }
    }
}
