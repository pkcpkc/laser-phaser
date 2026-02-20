import Phaser from 'phaser';
import type { Laser } from './types';
import { WeaponBase } from '../weapon-base';

import { ModuleType } from '../module-types';

// Trail Effect Constants
const TRAIL_CIRCLE_RADIUS = 2;
const TRAIL_SIZE = 4;
const TRAIL_LIFESPAN = 150;
const TRAIL_SCALE_START = 0.8;
const TRAIL_ALPHA_START = 0.6;


/**
 * Base class for laser weapons.
 * Extends WeaponBase with laser-specific trail effects.
 */
export abstract class BaseLaser extends WeaponBase implements Laser {
    readonly type: ModuleType.LASER | ModuleType.ROCKET = ModuleType.LASER;
    private static globalEmitters: Map<Phaser.Scene, Map<number, Phaser.GameObjects.Particles.ParticleEmitter>> = new Map();

    /**
     * Add a glowing trail effect behind the laser.
     */
    protected override addTrailEffect(scene: Phaser.Scene, laser: Phaser.Physics.Matter.Image) {
        // Create trail particle texture if needed
        const trailTextureKey = `${this.TEXTURE_KEY}-trail`;
        if (!scene.textures.exists(trailTextureKey)) {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(this.COLOR, 1);
            g.fillCircle(TRAIL_CIRCLE_RADIUS, TRAIL_CIRCLE_RADIUS, TRAIL_CIRCLE_RADIUS);
            g.generateTexture(trailTextureKey, TRAIL_SIZE, TRAIL_SIZE);
            g.destroy();
        }

        // Initialize global emitters for this scene if not exists
        if (!BaseLaser.globalEmitters.has(scene)) {
            BaseLaser.globalEmitters.set(scene, new Map());

            // Cleanup on scene shutdown
            scene.events.once('shutdown', () => {
                BaseLaser.globalEmitters.delete(scene);
            });
        }

        const sceneEmitters = BaseLaser.globalEmitters.get(scene)!;

        // Ensure an emitter exists for this specific color color
        if (!sceneEmitters.has(this.COLOR)) {
            const particles = scene.add.particles(0, 0, trailTextureKey, {
                lifespan: TRAIL_LIFESPAN,
                scale: { start: TRAIL_SCALE_START, end: 0 },
                alpha: { start: TRAIL_ALPHA_START, end: 0 },
                tint: this.COLOR,
                speed: 0,
                blendMode: 'ADD',
                emitting: false
            });
            // Ensure particles render behind ships
            particles.setDepth(-1);
            sceneEmitters.set(this.COLOR, particles);
        }

        const emitter = sceneEmitters.get(this.COLOR)!;

        // Since we are pooling projectiles, we just register an update hook on the projectile itself
        // Or we can let the projectile's preUpdate emit particles
        // For simplicity, we can inject a custom update function into the laser if pooling is active
        (laser as any).emitTrail = () => {
            if (laser.active) {
                emitter.emitParticleAt(laser.x, laser.y);
            }
        };

        if (!(laser as any).hasTrailHook) {
            (laser as any).hasTrailHook = true;
            const originalPreUpdate = (laser as any).preUpdate;
            (laser as any).preUpdate = function (time: number, delta: number) {
                if (originalPreUpdate) originalPreUpdate.call(this, time, delta);
                if (this.active && this.emitTrail) {
                    this.emitTrail();
                }
            };
        }
    }
}
