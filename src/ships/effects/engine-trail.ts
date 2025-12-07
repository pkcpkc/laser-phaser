import Phaser from 'phaser';
import type { Ship } from '../ship';
import type { ShipEffect } from './types';

export class EngineTrail implements ShipEffect {
    private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(ship: Ship) {
        const scene = ship.sprite.scene;

        this.emitter = scene.add.particles(0, 0, 'flare-white', {
            speed: {
                onEmit: () => {
                    if (ship.sprite.active && ship.sprite.body) {
                        return (ship.sprite.body as MatterJS.BodyType).speed;
                    }
                    return 0;
                }
            },
            lifespan: {
                onEmit: () => {
                    if (ship.sprite.active && ship.sprite.body) {
                        return Phaser.Math.Percent((ship.sprite.body as MatterJS.BodyType).speed, 0, 300) * 2000;
                    }
                    return 0;
                }
            },
            alpha: {
                onEmit: () => {
                    if (ship.sprite.active && ship.sprite.body) {
                        return Phaser.Math.Percent((ship.sprite.body as MatterJS.BodyType).speed, 0, 300) * 1000;
                    }
                    return 0;
                }
            },
            scale: { start: 1.0, end: 0 },
            blendMode: 'ADD'
        });

        this.emitter.setDepth(-1);
        this.emitter.startFollow(ship.sprite);
    }

    destroy() {
        this.emitter.destroy();
    }
}
