import Phaser from 'phaser';
import { GalaxyFactory } from '../galaxies/galaxy-factory';
import { Galaxy } from '../galaxies/galaxy';
import { PlanetVisuals } from '../galaxies/planets/planet-visuals';
import { DemoGalaxyConfig } from '../galaxies/configs/demo-galaxy';
import { PlanetEffectFactory } from '../galaxies/planets/planet-effect-factory';

export default class PlanetEffectsScene extends Phaser.Scene {
    private galaxy!: Galaxy;
    private visuals!: PlanetVisuals;
    private selector?: HTMLSelectElement;

    constructor() {
        super('PlanetEffectsScene');
    }

    create() {
        console.log('PlanetEffectsScene: Started');

        // 1. Initialize Galaxy (Data Only)
        // We use 'demo-galaxy' as base, but we might want to iterate purely on configs if possible.
        // For now, we load the full galaxy to get the planet data structures.
        this.galaxy = GalaxyFactory.create('demo-galaxy');

        // 2. Initialize Visuals Helper
        // We instantiate it directly since we don't need full DI container for this debug scene
        this.visuals = new PlanetVisuals(this);

        // 3. Setup UI (Dropdown)
        this.createPlanetSelector();

        // 4. Initial Display
        const planets = this.getSortedPlanets();
        if (planets.length > 0) {
            this.showPlanet(planets[0].id);
        }
    }

    private getSortedPlanets() {
        // We need to init the galaxy to populate planets array efficiently or just parse config?
        // Galaxy.init populate data.
        // Let's do a lightweight init.
        // Galaxy.init expects a scene to create data? No, createPlanetData takes scene.
        // We need to run init to get the PlanetData objects which visuals need.
        const { width, height } = this.scale;

        // We intentionally don't call this.galaxy.init here because it lays out planets in the galaxy view.
        // We want to manually position one planet in the center.
        // However, we DO need the PlanetData objects constructed.
        // Galaxy.init does: cleanup -> createPlanetData -> layoutPlanets.
        // We can mimic the creation part.

        // Let's use the public init but immediately clear positions? 
        // Or access the internal config directly?
        // Accessing config is better to get the list, but we need PlanetData for visuals.
        // Let's just run galaxy.init and then hide everything/reposition what we need.
        this.galaxy.init(this, width, height);

        const planets = this.galaxy.getAll();
        return planets.sort((a, b) => a.name.localeCompare(b.name));
    }

    private createPlanetSelector() {
        this.selector = document.createElement('select');
        this.selector.style.position = 'absolute';
        this.selector.style.top = '20px';
        this.selector.style.left = '50%';
        this.selector.style.transform = 'translateX(-50%)';
        this.selector.style.zIndex = '1000';
        this.selector.style.padding = '10px';
        this.selector.style.fontSize = '16px';
        this.selector.style.fontFamily = 'Oswald, sans-serif';

        const planets = this.getSortedPlanets();

        planets.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.text = p.name;
            this.selector!.appendChild(option);
        });

        this.selector.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            this.showPlanet(target.value);
        });

        document.body.appendChild(this.selector);

        // Cleanup DOM on scene shutdown
        this.events.once('shutdown', () => {
            if (this.selector) {
                this.selector.remove();
            }
        });
    }

    private showPlanet(id: string) {
        console.log(`Debug: Showing planet ${id}`);

        // Cleanup existing
        // We can't easily destroy just one planet's visuals via Galaxy class without cleanup() logic.
        // But visuals.createVisuals creates new objects.
        // We should ensure old ones are destroyed.
        this.galaxy.cleanup();

        // Re-init galaxy to regenerate fresher data objects (since cleanup destroyed them)
        const { width, height } = this.scale;
        this.galaxy.init(this, width, height);

        // Fix: Destroy effects of all other planets to prevent them from appearing at (0,0)
        this.galaxy.getAll().forEach(p => {
            if (p.id !== id) {
                p.effects?.forEach(e => e.destroy?.());
                p.effects = [];
            }
        });

        const planet = this.galaxy.getById(id);
        if (!planet) return;

        // Setup for Single View
        planet.hidden = false;

        // Center it
        planet.x = width / 2;
        planet.y = height / 2;

        // Enforce uniform scale for debug view
        planet.visualScale = 2.0;

        // Recreate effects so they pick up the new scale
        const originalConfig = DemoGalaxyConfig.planets.find(p => p.id === id);
        if (originalConfig && originalConfig.effects) {
            // Destroy old effects (created with original scale)
            planet.effects?.forEach(e => e.destroy?.());

            // Create new effects (will use new planet.visualScale)
            planet.effects = originalConfig.effects
                .map(effectConfig => PlanetEffectFactory.create(this, planet, effectConfig))
                .filter((e): e is NonNullable<typeof e> => !!e);
        }

        // Render
        this.visuals.createVisuals([planet], 'demo-galaxy', () => { });
        this.visuals.updateVisibility([planet]);
    }

    update(time: number, delta: number) {
        this.visuals.update(time, delta);
    }
}
