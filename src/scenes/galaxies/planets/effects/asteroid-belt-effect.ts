import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import { BaseRingEffect } from './base-ring-effect';

export interface AsteroidBeltConfig {
    type: 'asteroid-belt';
    color?: number;       // Base asteroid color (default: 0x8B7355 - rocky brown)
    angle?: number;       // Tilt angle in degrees (default: -20)
    asteroidCount?: number; // Number of asteroids (default: 40)
    innerRadius?: number; // Inner radius multiplier (default: 35)
    outerRadius?: number; // Outer radius multiplier (default: 60)
    rotationSpeed?: number; // Rotation speed in radians/sec (default: 0.15)
}

interface AsteroidData {
    sprite: Phaser.GameObjects.Graphics;
    angle: number;
    radiusX: number;
    radiusY: number;
    rotationSpeed: number;
    selfRotationSpeed: number;
}

export class AsteroidBeltEffect extends BaseRingEffect {
    public static readonly effectType = 'asteroid-belt';

    private config: AsteroidBeltConfig;
    private asteroids: AsteroidData[] = [];
    private backAsteroids: AsteroidData[] = [];
    private frontAsteroids: AsteroidData[] = [];
    private dustEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, planet: PlanetData, config: AsteroidBeltConfig) {
        super(scene, planet, { angle: config.angle });
        this.config = config;
        this.create();
    }

    public update(time: number, delta: number): void {
        super.update?.(time, delta);

        if (this.planet.hidden ?? true) {
            return;
        }

        const tilt = this.tilt;
        const deltaSeconds = delta / 1000;

        // Update all asteroids
        for (const asteroid of this.asteroids) {
            // Orbital movement
            asteroid.angle += asteroid.rotationSpeed * deltaSeconds;

            // Calculate position on tilted ellipse
            const ux = asteroid.radiusX * Math.cos(asteroid.angle);
            const uy = asteroid.radiusY * Math.sin(asteroid.angle);

            // Apply tilt rotation
            const tx = ux * Math.cos(tilt) - uy * Math.sin(tilt);
            const ty = ux * Math.sin(tilt) + uy * Math.cos(tilt);

            asteroid.sprite.setPosition(this.planet.x + tx, this.planet.y + ty);

            // Self rotation
            asteroid.sprite.rotation += asteroid.selfRotationSpeed * deltaSeconds;

            // Determine if asteroid should be in front or back based on Y position
            const isFront = ty > 0;
            const targetDepth = isFront ? this.baseDepth + 2 : this.baseDepth;

            if (asteroid.sprite.depth !== targetDepth) {

                asteroid.sprite.setDepth(targetDepth);
            }
        }

        // Sync dust emitter with planet position
        if (this.dustEmitter) {
            this.dustEmitter.setPosition(this.planet.x, this.planet.y);
        }
    }

    private create() {
        const baseColor = this.config.color ?? 0x8B7355;
        const scale = this.planet.visualScale || 1.0;

        const asteroidCount = this.config.asteroidCount ?? 40;
        const innerRadiusBase = (this.config.innerRadius ?? 35) * scale;
        const outerRadiusBase = (this.config.outerRadius ?? 60) * scale;
        const baseRotationSpeed = this.config.rotationSpeed ?? 0.15;

        // Flatter ring for asteroid belt look
        const radiusYRatio = 0.2;

        for (let i = 0; i < asteroidCount; i++) {
            // Random position on the ring
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

            // Random radius within the belt
            const radiusX = Phaser.Math.FloatBetween(innerRadiusBase, outerRadiusBase);
            const radiusY = radiusX * radiusYRatio;

            // Variable rotation speed (inner asteroids faster)
            const distanceRatio = (radiusX - innerRadiusBase) / (outerRadiusBase - innerRadiusBase);
            const rotationSpeed = baseRotationSpeed * (1.2 - distanceRatio * 0.4);

            // Random direction
            const direction = Math.random() > 0.1 ? 1 : -1; // 90% same direction

            // Create irregular asteroid shape
            const asteroidGraphics = this.scene.add.graphics();
            this.createAsteroidShape(asteroidGraphics, baseColor, scale);

            // Calculate initial position
            const ux = radiusX * Math.cos(angle);
            const uy = radiusY * Math.sin(angle);
            const tx = ux * Math.cos(this.tilt) - uy * Math.sin(this.tilt);
            const ty = ux * Math.sin(this.tilt) + uy * Math.cos(this.tilt);

            asteroidGraphics.setPosition(this.planet.x + tx, this.planet.y + ty);
            asteroidGraphics.setDepth(ty > 0 ? this.baseDepth + 2 : this.baseDepth);

            const asteroidData: AsteroidData = {
                sprite: asteroidGraphics,
                angle: angle,
                radiusX: radiusX,
                radiusY: radiusY,
                rotationSpeed: rotationSpeed * direction,
                selfRotationSpeed: Phaser.Math.FloatBetween(-2, 2)
            };

            this.asteroids.push(asteroidData);

            if (ty > 0) {
                this.frontAsteroids.push(asteroidData);
            } else {
                this.backAsteroids.push(asteroidData);
            }
        }

        // Add some dust particles between asteroids
        this.createDustParticles(innerRadiusBase, outerRadiusBase, radiusYRatio);

        if (this.planet.hidden ?? true) {
            this.setVisible(false);
        }
    }

    private createAsteroidShape(graphics: Phaser.GameObjects.Graphics, baseColor: number, scale: number) {
        // Random size for this asteroid
        const size = Phaser.Math.FloatBetween(2, 5) * scale;

        // Vary the color slightly
        const colorVariation = Phaser.Math.Between(-20, 20);
        const r = Math.min(255, Math.max(0, ((baseColor >> 16) & 0xFF) + colorVariation));
        const g = Math.min(255, Math.max(0, ((baseColor >> 8) & 0xFF) + colorVariation));
        const b = Math.min(255, Math.max(0, (baseColor & 0xFF) + colorVariation));
        const color = (r << 16) | (g << 8) | b;

        // Create irregular polygon shape
        const points: { x: number, y: number }[] = [];
        const vertexCount = Phaser.Math.Between(5, 8);

        for (let i = 0; i < vertexCount; i++) {
            const angle = (i / vertexCount) * Math.PI * 2;
            const radius = size * Phaser.Math.FloatBetween(0.6, 1.0);
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }

        // Draw filled shape
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.closePath();
        graphics.fillPath();

        // Add slight highlight
        graphics.fillStyle(0xFFFFFF, 0.2);
        graphics.fillCircle(-size * 0.2, -size * 0.2, size * 0.3);
    }

    private createDustParticles(innerRadius: number, outerRadius: number, radiusYRatio: number) {
        const dustColor = this.config.color ?? 0x8B7355;

        // Create dust emitter for subtle particle effect
        // Create dust emitter for subtle particle effect
        this.dustEmitter = this.scene.add.particles(this.planet.x, this.planet.y, 'flare-white', {
            color: [dustColor],
            alpha: { start: 0.3, end: 0 },
            scale: { start: 0.05, end: 0 },
            lifespan: 2000,
            blendMode: 'ADD',
            frequency: 100,
            speed: { min: 2, max: 8 },
            angle: { min: 0, max: 360 },

            emitZone: {
                source: {
                    getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
                        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                        const radiusX = Phaser.Math.FloatBetween(innerRadius, outerRadius);
                        const radiusY = radiusX * radiusYRatio;

                        const ux = radiusX * Math.cos(angle);
                        const uy = radiusY * Math.sin(angle);
                        const tx = ux * Math.cos(this.tilt) - uy * Math.sin(this.tilt);
                        const ty = ux * Math.sin(this.tilt) + uy * Math.cos(this.tilt);

                        point.x = tx;
                        point.y = ty;
                        return point;
                    }
                },
                type: 'random'
            }
        });

        this.dustEmitter.setDepth(this.baseDepth);
    }

    public setDepth(depth: number) {
        this.baseDepth = depth;
        super.setDepth(depth);
        // Asteroids update own depth in update()
        this.dustEmitter?.setDepth(depth + 1); // Dust behind front asteroids(2)? Or just middle(1)? 
        // Dust usually background, so 1 (with planet).
    }

    public getVisualElements(): Phaser.GameObjects.GameObject[] {
        const elements = super.getVisualElements();
        // Add all asteroids
        this.asteroids.forEach(a => elements.push(a.sprite));
        if (this.dustEmitter) elements.push(this.dustEmitter);
        return elements;
    }

    public setVisible(visible: boolean): void {
        super.setVisible(visible);

        for (const asteroid of this.asteroids) {
            asteroid.sprite.setVisible(visible);
        }
        this.dustEmitter?.setVisible(visible);
    }

    public destroy(): void {
        super.destroy();

        for (const asteroid of this.asteroids) {
            asteroid.sprite.destroy();
        }
        this.asteroids = [];
        this.backAsteroids = [];
        this.frontAsteroids = [];
    }
}
