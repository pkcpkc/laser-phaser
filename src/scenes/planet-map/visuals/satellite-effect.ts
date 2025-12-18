import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';

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

/**
 * Creates orbiting satellite effect around a planet.
 * Satellites circle the planet at different orbital distances, speeds, and tilted planes.
 * Each satellite has a shooting star trail effect.
 */
export class SatelliteEffect {
    private scene: Phaser.Scene;
    private planet: PlanetData;
    private satellites: Satellite[] = [];
    private updateListener: () => void;
    private tint: number;

    constructor(scene: Phaser.Scene, planet: PlanetData, config?: Partial<SatelliteConfig>) {
        this.scene = scene;
        this.planet = planet;

        const effectiveConfig = { ...DEFAULT_CONFIG, ...config };
        this.tint = effectiveConfig.tint;

        this.ensureSatelliteTexture();
        this.createSatellites(effectiveConfig);

        // Create update listener
        this.updateListener = () => this.update();
        this.scene.events.on('update', this.updateListener);
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

    private createSatellites(config: SatelliteConfig) {
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

    private update() {
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

            // Calculate 3D position on tilted orbit
            // Start with circular orbit in XZ plane
            const localX = Math.cos(sat.currentAngle) * sat.orbitRadius;
            const localZ = Math.sin(sat.currentAngle) * sat.orbitRadius;
            const localY = 0;

            // Apply orbital tilt (rotation around X axis)
            const tiltedY = localY * Math.cos(sat.orbitTilt) - localZ * Math.sin(sat.orbitTilt);
            const tiltedZ = localY * Math.sin(sat.orbitTilt) + localZ * Math.cos(sat.orbitTilt);

            // Apply orbital rotation (rotation around Y axis)
            const finalX = localX * Math.cos(sat.orbitRotation) + tiltedZ * Math.sin(sat.orbitRotation);
            const finalZ = -localX * Math.sin(sat.orbitRotation) + tiltedZ * Math.cos(sat.orbitRotation);
            const finalY = tiltedY;

            // Project to 2D:
            // finalY is the actual vertical height (from orbital tilt) -> Should be 1:1 on screen
            // finalZ is depth -> Contributes to screen Y due to camera angle (perspective)
            const perspectiveFlatten = 0.3; // View angle foreshortening
            const screenX = centerX + finalX;
            const screenY = centerY + finalY + finalZ * perspectiveFlatten;

            // Depth based on Z position (behind planet = negative Z = lower depth)
            const isFront = finalZ > 0;
            const depth = isFront ? 3 : -1;

            // Calculate alpha based on front/back
            const alpha = isFront ? 1.0 : 0.5;

            // Add current position to trail
            sat.trailPoints.unshift({ x: screenX, y: screenY, depth, alpha });

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
            sat.image.setPosition(screenX, screenY);

            // Set depth based on position
            sat.image.setDepth(depth);

            // Scale satellites slightly based on depth for subtle 3D effect
            const normalizedZ = (finalZ / sat.orbitRadius + 1) / 2; // 0 to 1
            const depthScale = 0.7 + normalizedZ * 0.3;
            sat.image.setScale(sat.size * scale * depthScale * textureScaleFactor);

            // Fade satellites slightly when at the back
            sat.image.setAlpha(alpha);
        }
    }

    public setVisible(visible: boolean) {
        for (const sat of this.satellites) {
            sat.image.setVisible(visible);
            sat.trail.setVisible(visible);
        }
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        for (const sat of this.satellites) {
            sat.image.destroy();
            sat.trail.destroy();
        }
        this.satellites = [];
    }
}

export interface SatelliteConfig {
    count: number;          // Number of satellites
    minOrbitRadius: number; // Minimum orbit radius (scaled by planet scale)
    maxOrbitRadius: number; // Maximum orbit radius
    minOrbitSpeed: number;  // Minimum angular speed (radians per frame)
    maxOrbitSpeed: number;  // Maximum angular speed
    minSize: number;        // Minimum satellite size
    maxSize: number;        // Maximum satellite size
    tint: number;           // Satellite color (default white)
}

const DEFAULT_CONFIG: SatelliteConfig = {
    count: 5,
    minOrbitRadius: 15,
    maxOrbitRadius: 30,
    minOrbitSpeed: 0.01,
    maxOrbitSpeed: 0.04,
    minSize: 1,
    maxSize: 2,
    tint: 0xffffff         // Default to white
};
