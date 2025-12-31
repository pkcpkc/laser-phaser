import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import { BaseOrbitEffect } from './base-orbit-effect';

export interface MiniMoonConfig {
    type: 'mini-moon';
    tint?: number;
    tilt?: number;
    scale?: number;
    orbitRadius?: number;
    orbitSpeed?: number;
    startAngle?: number;
}

/**
 * Creates a "Mini Moon" effect: a single smaller emoji orbiting the planet.
 * Similar to SatelliteEffect but for a single Text object that mirrors the parent's appearance.
 */
export class MiniMoonEffect extends BaseOrbitEffect {
    public static readonly effectType = 'mini-moon';

    private miniMoon: Phaser.GameObjects.Text;
    private trail: Phaser.GameObjects.Graphics;
    private trailPoints: { x: number, y: number, alpha: number }[] = [];

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
        super(scene, planet);
        this.tint = config.tint;

        // Apply config overrides
        if (config.scale !== undefined) this.sizeScale = config.scale;

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
            fontFamily: 'Oswald, sans-serif',
            fontSize: '48px', // Base size, will be scaled down
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);

        // Initial Position Calculation
        const px = this.calculateOrbitPosition(this.currentAngle, this.orbitRadius, this.orbitTilt, 0, this.planet.x, this.planet.y);
        this.miniMoon.setPosition(px.x, px.y);

        // Defer tint application to ensure postFX is ready
        this.scene.time.delayedCall(100, () => {
            if (!this.miniMoon || !this.miniMoon.scene) return; // Safety check if destroyed
            this.applyTint();

            // Add a subtle bloom for "glow" - DISABLED due to visual artifacts
            /* if (this.miniMoon.postFX) {
                this.miniMoon.postFX.addBloom(0xffffff, 1, 1, 1.2, 1.0);
            } */
        });

        // Initial visibility based on planet hidden state
        if (this.planet.hidden ?? true) {
            this.setVisible(false);
        }
    }

    private applyTint() {
        const tint = this.tint ?? this.planet.tint;
        if (tint === undefined) return;

        // Clear any existing tint and postFX
        this.miniMoon.clearTint();

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

    public onUpdate() {
        // Make sure planet still has valid position
        if (!this.planet.gameObject) return;

        const parentScale = this.planet.visualScale || 1.0;

        // Update angle
        this.currentAngle += this.orbitSpeed;
        if (this.currentAngle > Math.PI * 2) this.currentAngle -= Math.PI * 2;

        const centerX = this.planet.x;
        const centerY = this.planet.y;

        // Use base class calculation
        const pos = this.calculateOrbitPosition(
            this.currentAngle,
            this.orbitRadius,
            this.orbitTilt,
            0, // No extra rotation
            centerX,
            centerY
        );

        // Update Position
        this.miniMoon.setPosition(pos.x, pos.y);

        // Scale based on Z depth
        // MiniMoon legacy scaling: 0.8 + (normalizedZ * 0.4)
        const depthScale = 0.8 + (pos.normalizedZ * 0.4);
        const finalScale = this.sizeScale * parentScale * depthScale;
        this.miniMoon.setScale(finalScale);

        // Rotation (Self-rotation)
        this.miniMoon.angle += 2.0;

        // Depth sorting
        // Front: 1.2 (Above Planet at 1.0)
        // Back: 0.5 (Behind Planet at 1.0 and Overlay at 0.9)
        const baseDepth = pos.isFront ? 1.2 : 0.5;
        this.miniMoon.setDepth(this.depthOffset + baseDepth);
        this.trail.setDepth(this.depthOffset + (pos.isFront ? 1.15 : 0.45));

        // Alpha / Brightness - Dim when behind
        const baseAlpha = pos.isFront ? 1.0 : 0.6;
        this.miniMoon.setAlpha(baseAlpha);

        // ---- TRAIL LOGIC ----
        // If hidden/not visible, don't update trail points to avoid "ghost" building
        if (!this.miniMoon.visible) {
            this.trailPoints = [];
            this.trail.clear();
            return;
        }

        this.trailPoints.unshift({ x: pos.x, y: pos.y, alpha: baseAlpha });
        if (this.trailPoints.length > this.TRAIL_LENGTH) {
            this.trailPoints.pop();
        }

        this.trail.clear();
        const trailColor = this.tint ?? 0xffffff;

        if (this.trailPoints.length > 1) {
            for (let i = 1; i < this.trailPoints.length; i++) {
                const p1 = this.trailPoints[i - 1];
                const p2 = this.trailPoints[i];

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

    private depthOffset: number = 0;
    public setDepth(depth: number) {
        this.depthOffset = depth;
    }

    public clearParticles() {
        this.trailPoints = [];
        this.trail.clear();
    }

    public setVisible(visible: boolean) {
        this.miniMoon.setVisible(visible);
        this.trail.setVisible(visible);
    }

    protected onDestroy() {
        this.miniMoon.destroy();
        this.trail.destroy();
    }
}
