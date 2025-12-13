import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';

export abstract class BasePlanetVisual {
    protected scene: Phaser.Scene;
    protected planet: PlanetData;

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        this.scene = scene;
        this.planet = planet;
    }

    public abstract create(onClick: (planet: PlanetData) => void): void;

    public abstract update(time: number, delta: number): void;

    // Helper for locked particle effect
    protected addLockedParticleEffect() {
        if (this.planet.emitter) return;

        this.planet.emitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: [0xffffff],
            lifespan: 1000,
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0 },
            speed: { min: 10, max: 30 },
            blendMode: 'ADD',
            frequency: 100
        });
        if (this.planet.gameObject) {
            this.planet.emitter.startFollow(this.planet.gameObject, 0, -7);
        }
        this.planet.emitter.setDepth(1);
    }

    // Helper needed for visibility updates initiated by registry changes
    public updateVisibility(): void {
        if (!this.planet.gameObject) return;

        if (this.planet.unlocked) {
            if (!this.planet.usingOverlay) {
                this.planet.gameObject.setAlpha(1);
            }
        } else {
            this.planet.gameObject.setAlpha(0.8);
        }
    }
}
