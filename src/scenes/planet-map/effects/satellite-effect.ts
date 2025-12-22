import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import type { BaseEffectConfig } from '../planet-effect';
import { BaseOrbitEffect } from './base-orbit-effect';

interface TrailPoint {
    x: number;
    y: number;
    depth: number;
    alpha: number;
}

interface Satellite {
    image: Phaser.GameObjects.Image;
    trail: Phaser.GameObjects.Graphics;
    trailPoints: TrailPoint[];
    orbitRadius: number;
    orbitSpeed: number;
    currentAngle: number;
    orbitTilt: number;      // Tilt angle of the orbital plane (radians)
    orbitRotation: number;  // Rotation of the orbital plane around Y axis
    size: number;
}

const TRAIL_LENGTH = 15; // Number of trail segments

export interface SatelliteConfig extends BaseEffectConfig {
    type: 'satellite';
    count?: number;          // Number of satellites
    minOrbitRadius?: number; // Minimum orbit radius (scaled by planet scale)
    maxOrbitRadius?: number; // Maximum orbit radius
    minOrbitSpeed?: number;  // Minimum angular speed (radians per frame)
    maxOrbitSpeed?: number;  // Maximum angular speed
    minSize?: number;        // Minimum satellite size
    maxSize?: number;        // Maximum satellite size
    tint?: number;           // Satellite color (default white)
}

const DEFAULT_CONFIG: Partial<SatelliteConfig> = {
    count: 5,
    minOrbitRadius: 15,
    maxOrbitRadius: 30,
    minOrbitSpeed: 0.01,
    maxOrbitSpeed: 0.04,
    minSize: 1,
    maxSize: 2,
    tint: 0xffffff         // Default to white
};

/**
 * Creates orbiting satellite effect around a planet.
 * Satellites circle the planet at different orbital distances, speeds, and tilted planes.
 * Each satellite has a shooting star trail effect.
 */
export class SatelliteEffect extends BaseOrbitEffect {
    private satellites: Satellite[] = [];
    private tint: number;

    constructor(scene: Phaser.Scene, planet: PlanetData, config: SatelliteConfig) {
        super(scene, planet);

        const effectiveConfig = { ...DEFAULT_CONFIG, ...config } as Required<SatelliteConfig>;
        this.tint = effectiveConfig.tint;

        this.ensureSatelliteTexture();
        this.createSatellites(effectiveConfig);

        // Initial visibility based on planet hidden state
        if (this.planet.hidden ?? true) {
            this.setVisible(false);
        }
    }

    private ensureSatelliteTexture() {
        if (!this.scene.textures.exists('satellite-round')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(16, 16, 16);
            graphics.generateTexture('satellite-round', 32, 32);
            graphics.destroy();
        }
    }

    private createSatellites(config: Required<SatelliteConfig>) {
        const scale = this.planet.visualScale || 1.0;
        // Base size of the original "star" texture was 2px.
        // New texture is 32px. We need to scale down to match visual size.
        const textureScaleFactor = 2.0 / 32.0;

        for (let i = 0; i < config.count; i++) {
            // Randomize orbit properties for each satellite
            const orbitRadius = Phaser.Math.FloatBetween(
                config.minOrbitRadius * scale,
                config.maxOrbitRadius * scale
            );

            // Smaller orbits = faster (Kepler-ish feel)
            const radiusFactor = (orbitRadius - config.minOrbitRadius * scale) /
                ((config.maxOrbitRadius - config.minOrbitRadius) * scale);
            const orbitSpeed = Phaser.Math.Linear(
                config.maxOrbitSpeed,
                config.minOrbitSpeed,
                radiusFactor
            );

            // Randomize starting angle
            const startAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

            // Randomize direction (some go clockwise, some counter-clockwise)
            const direction = Phaser.Math.Between(0, 1) === 0 ? 1 : -1;

            // Random orbital plane tilt (0 = horizontal, PI/2 = vertical)
            const orbitTilt = Phaser.Math.FloatBetween(0, Math.PI * 0.5); // 0 to 90 degrees

            // Random rotation of the orbital plane around vertical axis
            const orbitRotation = Phaser.Math.FloatBetween(0, Math.PI * 2);

            // Satellite size varies slightly (unscaled base size)
            const size = Phaser.Math.FloatBetween(config.minSize, config.maxSize);

            // Create trail graphics
            const trail = this.scene.add.graphics();
            trail.setBlendMode(Phaser.BlendModes.ADD);

            // Create image using round texture
            const image = this.scene.add.image(0, 0, 'satellite-round');
            image.setScale(size * scale * textureScaleFactor);
            image.setTint(this.tint);
            image.setBlendMode(Phaser.BlendModes.ADD);

            this.satellites.push({
                image,
                trail,
                trailPoints: [],
                orbitRadius,
                orbitSpeed: orbitSpeed * direction,
                currentAngle: startAngle,
                orbitTilt,
                orbitRotation,
                size
            });
        }
    }

    public onUpdate() {
        // Make sure planet still has valid position
        if (!this.planet.gameObject) return;

        const centerX = this.planet.x;
        const centerY = this.planet.y;
        const scale = this.planet.visualScale || 1.0;
        const textureScaleFactor = 2.0 / 32.0;

        for (const sat of this.satellites) {
            // Update angle
            sat.currentAngle += sat.orbitSpeed;

            // Keep angle in 0-2PI range
            if (sat.currentAngle > Math.PI * 2) sat.currentAngle -= Math.PI * 2;
            if (sat.currentAngle < 0) sat.currentAngle += Math.PI * 2;

            // Calculate 3D position
            const pos = this.calculateOrbitPosition(
                sat.currentAngle,
                sat.orbitRadius,
                sat.orbitTilt,
                sat.orbitRotation,
                centerX,
                centerY
            );

            // Depth based on Z position (behind planet = negative Z = lower depth)
            const depth = pos.isFront ? this.baseDepth : -1;
            // Calculate alpha based on front/back
            const alpha = pos.isFront ? 1.0 : 0.5;

            // Add current position to trail
            sat.trailPoints.unshift({ x: pos.x, y: pos.y, depth, alpha });

            // Limit trail length
            if (sat.trailPoints.length > TRAIL_LENGTH) {
                sat.trailPoints.pop();
            }

            // Draw trail
            sat.trail.clear();
            for (let i = 1; i < sat.trailPoints.length; i++) {
                const point = sat.trailPoints[i];
                const prevPoint = sat.trailPoints[i - 1];

                // Fade alpha along trail - use higher base alpha for visibility
                const trailAlpha = (1 - i / TRAIL_LENGTH) * 0.8;
                const trailSize = sat.size * (1 - i / TRAIL_LENGTH) * 2.0 + 1;

                sat.trail.lineStyle(trailSize * scale, this.tint, trailAlpha);
                sat.trail.beginPath();
                sat.trail.moveTo(prevPoint.x, prevPoint.y);
                sat.trail.lineTo(point.x, point.y);
                sat.trail.strokePath();
            }

            // Set trail depth (slightly behind the satellite)
            sat.trail.setDepth(depth - 0.1);

            // Position satellite
            sat.image.setPosition(pos.x, pos.y);

            // Set depth based on position
            sat.image.setDepth(depth);

            // Scale satellites slightly based on depth for subtle 3D effect
            // Satellite effect legacy scale logic
            const depthScale = 0.7 + pos.normalizedZ * 0.3;
            sat.image.setScale(sat.size * scale * depthScale * textureScaleFactor);

            // Fade satellites slightly when at the back
            sat.image.setAlpha(alpha);
        }
    }

    private baseDepth = 3;

    public setDepth(depth: number) {
        this.baseDepth = depth;
    }

    public setVisible(visible: boolean) {
        for (const sat of this.satellites) {
            sat.image.setVisible(visible);
            sat.trail.setVisible(visible);
        }
    }

    protected onDestroy() {
        for (const sat of this.satellites) {
            sat.image.destroy();
            sat.trail.destroy();
        }
        this.satellites = [];
    }
}
