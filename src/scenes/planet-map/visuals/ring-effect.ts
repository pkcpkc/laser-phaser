import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';

/**
 * Handles ring effects for planets (both particle-based and solid).
 */
export class RingEffect {
    private scene: Phaser.Scene;
    private planet: PlanetData;

    // Tracked objects
    private backRing?: Phaser.GameObjects.Graphics;
    private frontRing?: Phaser.GameObjects.Graphics;
    private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        this.scene = scene;
        this.planet = planet;

        this.create();
    }

    private create() {
        if (!this.planet.rings?.color) return;

        if (this.planet.rings.type === 'solid') {
            this.createSolidRings();
        } else {
            this.createRingEmitters();
        }

        // Initial visibility
        if (!this.planet.unlocked) {
            this.setVisible(false);
        }
    }

    public setVisible(visible: boolean) {
        if (this.backRing) this.backRing.setVisible(visible);
        if (this.frontRing) this.frontRing.setVisible(visible);

        this.emitters.forEach(emitter => {
            emitter.setVisible(visible);
            emitter.active = visible;
        });
    }

    public destroy() {
        this.backRing?.destroy();
        this.frontRing?.destroy();
        this.emitters.forEach(e => e.destroy());
        this.emitters = [];
    }

    private createSolidRings() {
        const baseColor = this.planet.rings?.color ?? (this.planet.tint || 0xffffff);
        const isUnlocked = this.planet.unlocked ?? false;
        const scale = (isUnlocked && this.planet.visualScale) ? this.planet.visualScale : 0.8;

        const innerRadiusX = 30 * scale;
        const outerRadiusX = 55 * scale;
        const radiusYBase = 6 * scale;

        const tiltDeg = this.planet.rings?.angle ?? -20;
        const tilt = Phaser.Math.DegToRad(tiltDeg);

        const bandCount = 12;

        const createRingBand = (isFront: boolean) => {
            const graphics = this.scene.add.graphics();

            for (let i = 0; i < bandCount; i++) {
                const t = i / (bandCount - 1);

                const rX = Phaser.Math.Linear(innerRadiusX, outerRadiusX, t);
                const rY = radiusYBase * (rX / innerRadiusX);

                const distFromCenter = Math.abs(t - 0.5) * 2;
                const alpha = 0.9 - (distFromCenter * 0.6);
                const thickness = 3 * scale;

                graphics.lineStyle(thickness, baseColor, alpha);

                const startAngle = isFront ? 0 : Math.PI;
                const endAngle = isFront ? Math.PI : Math.PI * 2;
                const steps = 64;
                const step = (endAngle - startAngle) / steps;

                const points: { x: number, y: number }[] = [];

                for (let j = 0; j <= steps; j++) {
                    const angle = startAngle + (j * step);
                    const ux = rX * Math.cos(angle);
                    const uy = rY * Math.sin(angle);
                    const tx = ux * Math.cos(tilt) - uy * Math.sin(tilt);
                    const ty = ux * Math.sin(tilt) + uy * Math.cos(tilt);
                    points.push({ x: tx, y: ty });
                }

                graphics.beginPath();
                if (points.length > 0) {
                    graphics.moveTo(points[0].x, points[0].y);
                    for (let k = 1; k < points.length; k++) {
                        graphics.lineTo(points[k].x, points[k].y);
                    }
                }
                graphics.strokePath();
            }

            graphics.setPosition(this.planet.x, this.planet.y);

            this.scene.tweens.addCounter({
                from: 0,
                to: 100,
                duration: 3000,
                yoyo: true,
                repeat: -1,
                onUpdate: (tween) => {
                    graphics.alpha = 0.8 + (Math.sin(tween.totalProgress) * 0.1);
                }
            });

            return graphics;
        };

        this.backRing = createRingBand(false);
        this.backRing.setDepth(0);

        this.frontRing = createRingBand(true);
        this.frontRing.setDepth(2);

        const midRadiusX = (innerRadiusX + outerRadiusX) / 2;
        this.addSolidRingSparkles(midRadiusX, radiusYBase * (midRadiusX / innerRadiusX), tilt, scale, baseColor);
    }

    private addSolidRingSparkles(radiusX: number, radiusY: number, tilt: number, scale: number, color: number) {
        const getCenterX = () => this.planet.x;
        const getCenterY = () => this.planet.y;

        const createSparkleEmitter = (isFront: boolean) => {
            // If rotation is enabled, use much higher density to show flow
            const isRotating = this.planet.rings?.rotation;
            const flowFrequency = isRotating ? 30 : 150; // 30ms vs 150ms

            const config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
                color: [color],
                alpha: { start: 1, end: 0 },
                scale: { start: 0.1 * scale, end: 0 },
                lifespan: { min: 500, max: 1000 },
                blendMode: 'ADD',
                frequency: flowFrequency,
                stopAfter: 0,
                emitZone: {
                    source: {
                        getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
                            const centerX = getCenterX();
                            const centerY = getCenterY();

                            const minAngle = isFront ? 0 : Math.PI;
                            const maxAngle = isFront ? Math.PI : Math.PI * 2;
                            const angle = Phaser.Math.FloatBetween(minAngle, maxAngle);

                            const rX = radiusX;
                            const rY = radiusY;

                            const ux = rX * Math.cos(angle);
                            const uy = rY * Math.sin(angle);

                            const tx = ux * Math.cos(tilt) - uy * Math.sin(tilt);
                            const ty = ux * Math.sin(tilt) + uy * Math.cos(tilt);

                            point.x = centerX + tx;
                            point.y = centerY + ty;
                            return point;
                        }
                    },
                    type: 'random'
                }
            };

            // If rotation is enabled, add velocity logic
            if (isRotating) {
                config.emitCallback = (particle: Phaser.GameObjects.Particles.Particle) => {
                    const centerX = getCenterX();
                    const centerY = getCenterY();
                    const dx = particle.x - centerX;
                    const dy = particle.y - centerY;

                    // Calculate angle on screen
                    const angle = Math.atan2(dy, dx);

                    // Standard tangential direction is +90 degrees (PI/2)
                    // We add another 180 degrees (PI) as requested for "180 degree from circle tilt" effect
                    // Total offset = 1.5 * PI
                    const tangent = angle + (Math.PI * 1.5);
                    const speed = 40 * scale; // Faster speed for visible flow

                    particle.velocityX = Math.cos(tangent) * speed;
                    particle.velocityY = Math.sin(tangent) * speed;
                };
            }

            return this.scene.add.particles(0, 0, 'flare-white', config);
        };

        const backSparkles = createSparkleEmitter(false);
        backSparkles.setDepth(0.1);

        const frontSparkles = createSparkleEmitter(true);
        frontSparkles.setDepth(2.1);

        this.emitters.push(backSparkles, frontSparkles);
    }

    private createRingEmitters() {
        const ringColor = this.planet.rings?.color ?? (this.planet.tint || 0xffffff);
        const isUnlocked = this.planet.unlocked ?? false;
        const scale = (isUnlocked && this.planet.visualScale) ? this.planet.visualScale : 0.8;

        const radiusX = 48 * scale;
        const radiusY = 8 * scale;
        const thickness = 8 * scale;
        const yOffset = 5 * scale;
        const tiltDeg = this.planet.rings?.angle ?? -20;
        const tilt = Phaser.Math.DegToRad(tiltDeg);

        const getCenterX = () => this.planet.x;
        const getCenterY = () => this.planet.y - yOffset;

        const createEmitter = (isFront: boolean) => {
            return this.scene.add.particles(0, 0, 'flare-white', {
                color: [ringColor],
                alpha: { start: 0.5, end: 0 },
                scale: { start: 0.15 * scale, end: 0 },
                lifespan: this.planet.rings?.lifespan || 800,
                blendMode: 'ADD',
                frequency: 5,
                emitCallback: (particle: Phaser.GameObjects.Particles.Particle) => {
                    const centerX = getCenterX();
                    const centerY = getCenterY();
                    const dx = particle.x - centerX;
                    const dy = particle.y - centerY;

                    const angle = Math.atan2(dy, dx);
                    const tangent = angle + (Math.PI / 2);
                    const speed = 20 * scale;

                    particle.velocityX = Math.cos(tangent) * speed;
                    particle.velocityY = Math.sin(tangent) * speed;
                },
                emitZone: {
                    source: {
                        getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
                            const centerX = getCenterX();
                            const centerY = getCenterY();

                            const minAngle = isFront ? 0 : Math.PI;
                            const maxAngle = isFront ? Math.PI : Math.PI * 2;
                            const angle = Phaser.Math.FloatBetween(minAngle, maxAngle);

                            const rJitter = Phaser.Math.FloatBetween(-thickness, thickness);
                            const rX = radiusX + rJitter;
                            const rY = radiusY + (rJitter * (radiusY / radiusX));

                            const ux = rX * Math.cos(angle);
                            const uy = rY * Math.sin(angle);

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

        this.emitters.push(backEmitter, frontEmitter);
    }
}
