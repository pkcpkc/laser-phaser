import Phaser from 'phaser';
import type { PlanetData } from './planet-registry';
import { PlanetVisual } from './visuals/planet-visual';

export class PlanetVisuals {
    private scene: Phaser.Scene;
    private visuals: Map<string, PlanetVisual> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public createVisuals(planets: PlanetData[], onClick: (planet: PlanetData) => void) {
        planets.forEach(planet => {
            let visual: PlanetVisual;

            // Since we defeatured everything to be moons, we default to PlanetVisual
            // We can still use ID to use RingWorldVisual for fallback or specific cases if needed,
            // but the user instruction implies a replacement with matching moon variants.
            visual = new PlanetVisual(this.scene, planet);


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

    public update(time: number, delta: number) {
        this.visuals.forEach(visual => visual.update(time, delta));
    }
}
