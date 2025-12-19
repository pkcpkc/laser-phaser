import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';

export class GasRingEffect {
    private scene: Phaser.Scene;
    private planet: PlanetData;
    private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        this.scene = scene;
        this.planet = planet;
        this.create();
    }

    private create() {
        const ringColor = this.planet.rings?.color ?? (this.planet.tint || 0xffffff);
        const scale = this.planet.visualScale || 1.0;

        // 1. Reduce diameter (was 60/16) -> User requested broader: 55 -> Back to 48 but thicker
        const radiusX = 48 * scale;
        const radiusY = 8 * scale; // Reduced from 14 to 8 for flatter look
        const thickness = 8 * scale; // Slightly reduced thickness (was 10)
        const tiltDeg = this.planet.rings?.angle ?? -20;
        const tilt = Phaser.Math.DegToRad(tiltDeg);

        // Use arrow functions that reference this.planet directly for dynamic positioning
        const getCenterX = () => this.planet.x;
        const getCenterY = () => this.planet.y;

        const createEmitter = (isFront: boolean) => {
            return this.scene.add.particles(0, 0, 'flare-white', {
                color: [ringColor],
                alpha: { start: 0.5, end: 0 }, // Reduced alpha for higher density
                scale: { start: 0.15 * scale, end: 0 }, // Slightly smaller particles
                lifespan: this.planet.rings?.lifespan || 800, // Configurable lifespan
                blendMode: 'ADD',
                frequency: 5, // Much more dense (was 40)
                emitCallback: (particle: Phaser.GameObjects.Particles.Particle) => {
                    // Simulate rotation: Tangential velocity
                    // Vector from center (use dynamic center)
                    const centerX = getCenterX();
                    const centerY = getCenterY();
                    const dx = particle.x - centerX;
                    const dy = particle.y - centerY;

                    // Simple rotation logic: just push them "along" the ellipse roughly
                    // Tangent varies, but for a flat ellipse, mostly horizontal?
                    // Let's do proper tangent:
                    // Angle of position
                    const angle = Math.atan2(dy, dx);
                    // Tangent angle (Clockwise)
                    const tangent = angle + (Math.PI / 2);

                    // Speed
                    const speed = 20 * scale;

                    particle.velocityX = Math.cos(tangent) * speed;
                    particle.velocityY = Math.sin(tangent) * speed;
                },
                emitZone: {
                    source: {
                        getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
                            // Use dynamic center position
                            const centerX = getCenterX();
                            const centerY = getCenterY();

                            // Angle range: Front (0 to PI), Back (PI to 2PI)
                            // Standard circle logic: 0 is Right, PI/2 is Down.
                            // We want Front to be "Lower Half" -> y > 0 -> 0 to PI.
                            const minAngle = isFront ? 0 : Math.PI;
                            const maxAngle = isFront ? Math.PI : Math.PI * 2;
                            const angle = Phaser.Math.FloatBetween(minAngle, maxAngle);

                            // Add thickness
                            const rJitter = Phaser.Math.FloatBetween(-thickness, thickness);
                            const rX = radiusX + rJitter;
                            const rY = radiusY + (rJitter * (radiusY / radiusX));

                            // Unrotated ellipse point
                            const ux = rX * Math.cos(angle);
                            const uy = rY * Math.sin(angle);

                            // Rotate by tilt
                            const tx = ux * Math.cos(tilt) - uy * Math.sin(tilt);
                            const ty = ux * Math.sin(tilt) + uy * Math.cos(tilt);

                            point.x = centerX + tx;
                            point.y = centerY + ty;
                            return point;
                        }
                    },
                    type: 'random'
                }
            });
        };

        const backEmitter = createEmitter(false);
        backEmitter.setDepth(0);

        const frontEmitter = createEmitter(true);
        frontEmitter.setDepth(2);

        this.emitters = [backEmitter, frontEmitter];

        if (!this.planet.unlocked) {
            this.setVisible(false);
        }
    }

    public setVisible(visible: boolean) {
        this.emitters.forEach(emitter => {
            emitter.setVisible(visible);
            emitter.active = visible;
        });
    }

    public destroy() {
        this.emitters.forEach(e => e.destroy());
    }
}
