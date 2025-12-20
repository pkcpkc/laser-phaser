import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';
import type { BaseEffectConfig, IPlanetEffect } from '../planet-effect';

export interface MiniMoonConfig extends BaseEffectConfig {
    type: 'mini-moon';
    tint?: number;
    tilt?: number;
    size?: number;
    orbitRadius?: number;
    orbitSpeed?: number;
    startAngle?: number;
}

/**
 * Creates a "Mini Moon" effect: a single smaller emoji orbiting the planet.
 * Similar to SatelliteEffect but for a single Text object that mirrors the parent's appearance.
 */
export class MiniMoonEffect implements IPlanetEffect {
    private scene: Phaser.Scene;
    private planet: PlanetData;
    private miniMoon: Phaser.GameObjects.Text;
    private trail: Phaser.GameObjects.Graphics;
    private trailPoints: { x: number, y: number, alpha: number }[] = [];
    private updateListener: () => void;

    // Orbital parameters
    private orbitRadius: number = 50;
    private orbitSpeed: number = 0.02;
    private currentAngle: number = 0;
    private orbitTilt: number = 0;

    // Config
    private sizeScale: number = 0.4; // 40% of parent size
    private tint?: number;

    private readonly TRAIL_LENGTH = 50;

    constructor(scene: Phaser.Scene, planet: PlanetData, config: MiniMoonConfig) {
        this.scene = scene;
        this.planet = planet;
        this.tint = config.tint;

        // Apply config overrides
        if (config.size !== undefined) this.sizeScale = config.size;

        // Orbital setup
        const parentScale = this.planet.visualScale || 1.0;
        this.orbitRadius = (config.orbitRadius ?? 50) * parentScale;
        this.orbitSpeed = config.orbitSpeed ?? 0.02;
        this.currentAngle = config.startAngle ?? Phaser.Math.FloatBetween(0, Math.PI * 2);

        // Tilt
        const tiltDeg = config.tilt ?? 0;
        this.orbitTilt = Phaser.Math.DegToRad(tiltDeg);

        // Create the trail graphics
        this.trail = this.scene.add.graphics();
        this.trail.setBlendMode(Phaser.BlendModes.ADD);

        // Create the text object
        this.miniMoon = this.scene.add.text(0, 0, '🌕', {
            fontSize: '48px', // Base size, will be scaled down
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);

        // Defer tint application to ensure postFX is ready
        this.scene.time.delayedCall(100, () => {
            this.applyTint();
            // Add a subtle bloom for "glow"
            if (this.miniMoon.postFX) {
                this.miniMoon.postFX.addBloom(0xffffff, 1, 1, 1.2, 1.0);
            }
        });

        // Create update listener
        this.updateListener = () => this.onUpdate();
        this.scene.events.on('update', this.updateListener);
    }

    private applyTint() {
        const tint = this.tint ?? this.planet.tint;
        if (tint === undefined) return;

        // Clear any existing tint and postFX
        this.miniMoon.clearTint();
        // NB: We don't verify if postFX exists because applying tint/FX resets often
        // but since we are inside the delayed call where we also add Bloom, 
        // we should be careful. 
        // For this specific effect, we'll assume the ColorMatrix is the primary way to tint emojis.

        // First desaturate to grayscale
        const colorMatrix = this.miniMoon.postFX.addColorMatrix();
        colorMatrix.saturate(-1);

        // Then apply color through matrix multiplication
        const r = ((tint >> 16) & 0xFF) / 255;
        const g = ((tint >> 8) & 0xFF) / 255;
        const b = (tint & 0xFF) / 255;

        const tintMatrix = this.miniMoon.postFX.addColorMatrix();
        tintMatrix.multiply([
            r, 0, 0, 0, 0,
            0, g, 0, 0, 0,
            0, 0, b, 0, 0,
            0, 0, 0, 1, 0
        ]);
    }

    private onUpdate() {
        // Make sure planet still has valid position
        if (!this.planet.gameObject) return;

        const parentScale = this.planet.visualScale || 1.0;

        // Update angle
        this.currentAngle += this.orbitSpeed;
        if (this.currentAngle > Math.PI * 2) this.currentAngle -= Math.PI * 2;

        // Calculate 3D position
        const localX = Math.cos(this.currentAngle) * this.orbitRadius;
        const localZ = Math.sin(this.currentAngle) * this.orbitRadius; // Depth
        const localY = 0;

        // Apply tilt (rotate around X)
        const tilt = this.orbitTilt;
        const tiltedY = localY * Math.cos(tilt) - localZ * Math.sin(tilt);
        const tiltedZ = localY * Math.sin(tilt) + localZ * Math.cos(tilt);

        // Project
        const centerX = this.planet.x;
        const centerY = this.planet.y;

        // Perspective foreshortening
        const perspectiveFlatten = 0.3;

        const screenX = centerX + localX;
        const screenY = centerY + tiltedY + (tiltedZ * perspectiveFlatten);

        // Update Position
        this.miniMoon.setPosition(screenX, screenY);

        // Scale based on Z depth
        const normalizedZ = (tiltedZ / this.orbitRadius + 1) / 2; // 0..1
        const depthScale = 0.8 + (normalizedZ * 0.4); // vary size slightly

        const finalScale = this.sizeScale * parentScale * depthScale;
        this.miniMoon.setScale(finalScale);

        // Rotation (Self-rotation)
        this.miniMoon.angle += 2.0; // Faster rotation to be visible

        // Depth sorting
        const isFront = tiltedZ > 0;
        this.miniMoon.setDepth(isFront ? 1.1 : 0.9);
        this.trail.setDepth(isFront ? 1.05 : 0.85); // Trail slightly behind moon

        // Alpha / Brightness - Dim when behind
        const baseAlpha = isFront ? 1.0 : 0.6;
        this.miniMoon.setAlpha(baseAlpha);

        // ---- TRAIL LOGIC ----
        this.trailPoints.unshift({ x: screenX, y: screenY, alpha: baseAlpha });
        // Increase trail length significantly
        if (this.trailPoints.length > this.TRAIL_LENGTH) {
            this.trailPoints.pop();
        }

        this.trail.clear();
        // Use a brighter color override for testing if needed, but tint should work.
        // Let's enforce full opacity at start
        const trailColor = this.tint ?? 0xffffff;

        if (this.trailPoints.length > 1) {
            for (let i = 1; i < this.trailPoints.length; i++) {
                const p1 = this.trailPoints[i - 1];
                const p2 = this.trailPoints[i];

                // Fade out tail
                // Increase base width multiplier from 10 to 20
                const segmentAlpha = (1 - (i / this.trailPoints.length)) * p1.alpha * 0.8;
                const segmentWidth = (1 - (i / this.trailPoints.length)) * (30 * finalScale);

                this.trail.lineStyle(segmentWidth, trailColor, segmentAlpha);
                this.trail.beginPath();
                this.trail.moveTo(p1.x, p1.y);
                this.trail.lineTo(p2.x, p2.y);
                this.trail.strokePath();
            }
        }
    }

    public setVisible(visible: boolean) {
        this.miniMoon.setVisible(visible);
        this.trail.setVisible(visible);
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        this.miniMoon.destroy();
        this.trail.destroy();
    }
}
