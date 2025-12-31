import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import type { IPlanetEffect } from '../planet-effect';

export abstract class BaseRingEffect implements IPlanetEffect {
    protected scene: Phaser.Scene;
    protected planet: PlanetData;
    protected occluder?: Phaser.GameObjects.Graphics;

    protected backElement?: Phaser.GameObjects.GameObject | Phaser.GameObjects.Particles.ParticleEmitter;
    protected frontElement?: Phaser.GameObjects.GameObject | Phaser.GameObjects.Particles.ParticleEmitter;
    protected tilt: number = 0;

    constructor(scene: Phaser.Scene, planet: PlanetData, config?: { angle?: number }) {
        this.scene = scene;
        this.planet = planet;

        if (config?.angle !== undefined) {
            this.tilt = Phaser.Math.DegToRad(config.angle);
        } else {
            this.tilt = Phaser.Math.DegToRad(-20); // Default tilt
        }

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

        if (this.backElement) {
            // Safe check for setVisible
            if ('setVisible' in this.backElement) {
                (this.backElement as any).setVisible(visible);
            }
            if ('active' in this.backElement) {
                this.backElement.active = visible;
            }
        }

        if (this.frontElement) {
            if ('setVisible' in this.frontElement) {
                (this.frontElement as any).setVisible(visible);
            }
            if ('active' in this.frontElement) {
                this.frontElement.active = visible;
            }
        }
    }

    public destroy(): void {
        if (this.occluder) {
            this.occluder.destroy();
        }

        if (this.backElement) {
            this.backElement.destroy();
        }

        if (this.frontElement) {
            this.frontElement.destroy();
        }
    }

    // Optional update method
    public update?(_time: number, _delta: number): void {
        // Skip update if planet is hidden
        if (this.planet.hidden ?? true) {
            return;
        }

        if (this.occluder) {
            this.occluder.setPosition(this.planet.x, this.planet.y);
        }

        // Use type guard or checks
        if (this.backElement && 'setPosition' in this.backElement) {
            // Emitters don't typically need setPosition called every frame like this unless we are moving the whole thing manually
            // But Containers do.
            (this.backElement as any).setPosition(this.planet.x, this.planet.y);
        }
        if (this.frontElement && 'setPosition' in this.frontElement) {
            (this.frontElement as any).setPosition(this.planet.x, this.planet.y);
        }
    }
}
