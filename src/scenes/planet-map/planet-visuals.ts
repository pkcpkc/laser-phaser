import Phaser from 'phaser';
import type { PlanetData } from './planet-registry';
import { BasePlanetVisual } from './visuals/base-planet-visual';
import { EarthVisual } from './visuals/earth-visual';
import { RingWorldVisual } from './visuals/ring-world-visual';
import { AdjustableMoonVisual } from './visuals/adjustable-moon-visual';

export class PlanetVisuals {
    private scene: Phaser.Scene;
    private visuals: Map<string, BasePlanetVisual> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public createVisuals(planets: PlanetData[], onClick: (planet: PlanetData) => void) {
        planets.forEach(planet => {
            let visual: BasePlanetVisual;

            if (planet.id === 'earth') {
                visual = new EarthVisual(this.scene, planet);
            } else if (planet.id === 'ring-world') {
                visual = new RingWorldVisual(this.scene, planet);
            } else if (planet.type === 'moon') {
                visual = new AdjustableMoonVisual(this.scene, planet);
            } else {
                // Fallback or generic planet
                visual = new RingWorldVisual(this.scene, planet); // Default to static-ish
            }

            visual.create(onClick);
            this.visuals.set(planet.id, visual);
        });
    }

    public updateVisibility(planets: PlanetData[]) {
        planets.forEach(planet => {
            const visual = this.visuals.get(planet.id);
            if (visual) {
                visual.updateVisibility();
            }
        });
    }
}
