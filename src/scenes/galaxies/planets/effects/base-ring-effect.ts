import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import type { IPlanetEffect } from '../planet-effect';

export abstract class BaseRingEffect implements IPlanetEffect {
    protected scene: Phaser.Scene;
    protected planet: PlanetData;
    protected backElement?: Phaser.GameObjects.GameObject | Phaser.GameObjects.Particles.ParticleEmitter;
    protected frontElement?: Phaser.GameObjects.GameObject | Phaser.GameObjects.Particles.ParticleEmitter;
    protected tilt: number = 0;

    protected baseDepth: number = 0;

    constructor(scene: Phaser.Scene, planet: PlanetData, config?: { angle?: number }) {
        this.scene = scene;
        this.planet = planet;

        if (config?.angle !== undefined) {
            this.tilt = Phaser.Math.DegToRad(config.angle);
        } else {
            this.tilt = Phaser.Math.DegToRad(-20); // Default tilt
        }
    }



    public setDepth(depth: number) {
        this.baseDepth = depth;
        if (this.backElement && 'setDepth' in this.backElement) {
            (this.backElement as any).setDepth(this.baseDepth);
        }
        if (this.frontElement && 'setDepth' in this.frontElement) {
            (this.frontElement as any).setDepth(this.baseDepth + 2); // Above planet (which is usually baseDepth + 1 effectively)
        }
    }

    public getDepth(): number {
        return this.baseDepth;
    }

    public setVisible(visible: boolean): void {

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

        if (this.backElement) {
            this.backElement.destroy();
        }

        if (this.frontElement) {
            this.frontElement.destroy();
        }
    }

    public update?(_time: number, _delta: number): void {
        if (this.planet.hidden ?? true) {
            return;
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

    public getVisualElements(): Phaser.GameObjects.GameObject[] {
        const elements: Phaser.GameObjects.GameObject[] = [];
        if (this.backElement && (this.backElement instanceof Phaser.GameObjects.GameObject)) elements.push(this.backElement);
        // Front element
        if (this.frontElement && (this.frontElement instanceof Phaser.GameObjects.GameObject)) elements.push(this.frontElement);
        return elements;
    }
}
