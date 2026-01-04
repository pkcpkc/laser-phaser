import Phaser from 'phaser';
import type { Laser } from './types';
import { WeaponBase } from '../weapon-base';
import { TimeUtils } from '../../../utils/time-utils';

// Trail Effect Constants
const TRAIL_CIRCLE_RADIUS = 2;
const TRAIL_SIZE = 4;
const TRAIL_LIFESPAN = 150;
const TRAIL_SCALE_START = 0.8;
const TRAIL_ALPHA_START = 0.6;
const CLEANUP_DELAY = 200;

/**
 * Base class for laser weapons.
 * Extends WeaponBase with laser-specific trail effects.
 */
export abstract class BaseLaser extends WeaponBase implements Laser {
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

        const particles = scene.add.particles(0, 0, trailTextureKey, {
            lifespan: TRAIL_LIFESPAN,
            scale: { start: TRAIL_SCALE_START, end: 0 },
            alpha: { start: TRAIL_ALPHA_START, end: 0 },
            tint: this.COLOR,
            speed: 0,
            blendMode: 'ADD',
            emitting: false
        });

        const updateListener = () => {
            if (laser.active) {
                particles.emitParticleAt(laser.x, laser.y);
            }
        };

        scene.events.on('update', updateListener);

        laser.once('destroy', () => {
            scene.events.off('update', updateListener);
            TimeUtils.delayedCall(scene, CLEANUP_DELAY, () => {
                particles.destroy();
            });
        });
    }
}
