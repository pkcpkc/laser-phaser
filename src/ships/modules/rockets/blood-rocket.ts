import Phaser from 'phaser';
import { BaseRocket } from './base-rocket';

export class BloodRocket extends BaseRocket {
    readonly TEXTURE_KEY = 'blood-rocket';
    readonly mountTextureKey = 'blood-rocket-mount';
    readonly COLOR = 0xcc0000; // Deep blood red
    readonly SPEED = 4;
    readonly recoil = 0.1;
    readonly width = 4;
    readonly height = 4;

    readonly reloadTime = 2000;
    readonly firingDelay = { min: 500, max: 1500 };

    readonly damage = 20;

    readonly maxAmmo = 20;

    constructor() {
        super();
        this.currentAmmo = this.maxAmmo;
    }

    override createTexture(scene: Phaser.Scene) {
        // Create projectile texture (Invisible/Transparent)
        // We rely entirely on the particle helix for visuals
        if (!scene.textures.exists(this.TEXTURE_KEY)) {
            const size = 2; // Tiny
            const graphics = scene.make.graphics({ x: 0, y: 0 });

            // Draw nothing or a transparent pixel
            graphics.fillStyle(this.COLOR, 0); // Alpha 0
            graphics.fillRect(0, 0, size, size);

            graphics.generateTexture(this.TEXTURE_KEY, size, size);
            graphics.destroy();
        }

        // Create mount texture (Single Red Dot / Nozzle)
        if (!scene.textures.exists(this.mountTextureKey)) {
            const size = 10;
            const graphics = scene.make.graphics({ x: 0, y: 0 });
            const cx = size / 2;
            const cy = size / 2;

            graphics.fillStyle(this.COLOR, 1);
            graphics.fillCircle(cx, cy, 3); // Single "fat" dot as the mount/nozzle

            graphics.generateTexture(this.mountTextureKey, size, size);
            graphics.destroy();
        }
    }

    override fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        category: number,
        collidesWith: number,
        shipVelocity?: { x: number; y: number }
    ) {
        // Init ammo if needed (matching BaseRocket logic)
        if (this.currentAmmo === undefined) {
            this.currentAmmo = this.maxAmmo;
        }

        if (this.currentAmmo <= 0) {
            return undefined;
        }

        const delay = Phaser.Math.Between(0, 300);

        const fireLogic = () => {
            const rocket = super.fire(scene, x, y, angle, category, collidesWith, shipVelocity);
            if (rocket) {
                this.addTrailEffect(scene, rocket);
            }
            return rocket;
        };

        if (delay === 0) {
            return fireLogic();
        }

        scene.time.delayedCall(delay, fireLogic);

        // Return a dummy object to satisfy the Ship's "did we fire?" check so it updates the cooldown.
        // The actual ammo decrement happens when super.fire() is called in the callback.
        return {} as Phaser.Physics.Matter.Image;
    }

    addMountEffect(scene: Phaser.Scene, mountSprite: Phaser.GameObjects.Image) {
        // Create dot texture if needed
        if (!scene.textures.exists('blood-dot-particle')) {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0xff0000);
            g.fillCircle(4, 4, 4);
            g.generateTexture('blood-dot-particle', 8, 8);
            g.destroy();
        }

        const particles = scene.add.particles(0, 0, 'blood-dot-particle', {
            lifespan: 500,
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.8, end: 0 },
            tint: [0xff0000, 0xdd0000],
            speed: 0,
            blendMode: 'NORMAL',
            emitting: false
        });

        let time = 0;
        const speed = 0.3;
        const radius = 4;
        const numDots = 3;

        // Catapult effect: oscillate rotation around mounting point
        const catapultAmplitude = 2; // ~30 degrees in radians
        const catapultSpeed = 1; // Oscillation speed
        let catapultTime = Math.random() * Math.PI * 2; // Random start phase
        let baseRotation: number | null = null; // Store the base rotation from ship

        const updateListener = () => {
            if (mountSprite.active && mountSprite.visible) {
                time += speed;
                catapultTime += catapultSpeed;

                // Store the base rotation on first update (from ship.ts updateMounts)
                // We need to apply our oscillation on top of the ship's rotation
                if (baseRotation === null) {
                    baseRotation = mountSprite.rotation;
                }

                // Apply catapult oscillation
                const catapultOffset = Math.sin(catapultTime) * catapultAmplitude;
                mountSprite.setRotation(baseRotation + catapultOffset);

                const rotation = mountSprite.rotation;
                const perpAngle = rotation + Math.PI / 2;
                const perpX = Math.cos(perpAngle);
                const perpY = Math.sin(perpAngle);

                for (let i = 0; i < numDots; i++) {
                    const phase = (Math.PI * 2 * i) / numDots;
                    const theta = time + phase;
                    const lateralOffset = Math.sin(theta) * radius;

                    const x = mountSprite.x + perpX * lateralOffset;
                    const y = mountSprite.y + perpY * lateralOffset;

                    scene.time.delayedCall(Math.random() * 50, () => {
                        if (particles.scene) {
                            particles.emitParticleAt(x, y);
                        }
                    });
                }
            } else {
                // Reset base rotation when sprite becomes invisible (e.g., during reload)
                baseRotation = null;
            }
        };

        scene.events.on('update', updateListener);

        mountSprite.once('destroy', () => {
            scene.events.off('update', updateListener);
            scene.time.delayedCall(500, () => {
                particles.destroy();
            });
        });
    }

    protected override addTrailEffect(scene: Phaser.Scene, rocket: Phaser.Physics.Matter.Image) {
        // Create a particle emitter for the trails
        const particles = scene.add.particles(0, 0, this.TEXTURE_KEY, {
            lifespan: 500,
            scale: { start: 0.4, end: 0 }, // Base scale
            alpha: { start: 0.8, end: 0 },
            tint: [0xff0000, 0xdd0000],
            speed: 0, // Static trail points
            blendMode: 'NORMAL',
            emitting: false
        });

        // Ensure particle dot texture
        if (!scene.textures.exists('blood-dot-particle')) {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0xff0000);
            g.fillCircle(4, 4, 4); // 8x8 dot
            g.generateTexture('blood-dot-particle', 8, 8);
            g.destroy();
        }
        particles.setTexture('blood-dot-particle');

        // Animation state
        let time = 0;
        const speed = 0.3; // Rotation speed
        const radius = 2; // Width of the helix - tighter spacing
        const numDots = 3;

        const updateListener = () => {
            if (rocket.active) {
                time += speed;

                // Get flight direction
                // Default to rotation if velocity is small (e.g. start)
                let flightAngle = rocket.rotation;
                if (rocket.body && rocket.body.velocity) {
                    const vx = rocket.body.velocity.x;
                    const vy = rocket.body.velocity.y;
                    if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
                        flightAngle = Math.atan2(vy, vx);
                    }
                }
                rocket.setRotation(flightAngle); // Keep head pointing forward

                // Perpendicular vector (Left/Right relative to flight)
                const perpAngle = flightAngle + Math.PI / 2;
                const perpX = Math.cos(perpAngle);
                const perpY = Math.sin(perpAngle);

                for (let i = 0; i < numDots; i++) {
                    const phase = (Math.PI * 2 * i) / numDots;
                    const theta = time + phase;

                    // Pseudo 3D Calculation
                    // 'sin' gives lateral offset (wobble left/right)
                    // 'cos' gives depth (z-index) simulation via scale

                    const lateralOffset = Math.sin(theta) * radius;
                    // lateralOffset provides the wobble effect

                    // Position
                    const x = rocket.x + perpX * lateralOffset;
                    const y = rocket.y + perpY * lateralOffset;

                    scene.time.delayedCall(Math.random() * 50, () => {
                        if (particles.scene) {
                            particles.emitParticleAt(x, y);
                        }
                    });
                }
            }
        };

        scene.events.on('update', updateListener);

        // Ensure cleanup if scene shuts down or rocket is destroyed
        rocket.once('destroy', () => {
            scene.events.off('update', updateListener);
            // Destroy the emitter
            scene.time.delayedCall(500, () => {
                particles.destroy();
            });
        });
    }
}
