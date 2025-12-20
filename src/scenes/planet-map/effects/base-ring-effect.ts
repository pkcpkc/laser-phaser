import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';
import type { IPlanetEffect } from '../planet-effect';

export abstract class BaseRingEffect implements IPlanetEffect {
    protected scene: Phaser.Scene;
    protected planet: PlanetData;
    protected occluder?: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        this.scene = scene;
        this.planet = planet;
        this.createOccluder();
    }

    protected createOccluder() {
        this.occluder = this.scene.add.graphics();
        this.occluder.fillStyle(0x000000, 1);
        // Use larger radius (22) to fully cover moon including transparency
        this.occluder.fillCircle(0, 0, 22);
        this.occluder.setPosition(this.planet.x, this.planet.y);
        this.occluder.setDepth(0.5); // Between BackRing (0) and Moon (1)

        // Scale with planet if needed
        if (this.planet.visualScale) {
            this.occluder.setScale(this.planet.visualScale);
        }
    }

    public setVisible(visible: boolean): void {
        if (this.occluder) {
            this.occluder.setVisible(visible);
        }
    }

    public destroy(): void {
        if (this.occluder) {
            this.occluder.destroy();
        }
    }

    // Optional update method
    public update?(_time: number, _delta: number): void {
        if (this.occluder) {
            this.occluder.setPosition(this.planet.x, this.planet.y);
        }
    }
}
