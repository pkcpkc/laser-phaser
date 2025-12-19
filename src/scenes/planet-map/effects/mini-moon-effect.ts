import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';

/**
 * Creates a "Mini Moon" effect: a single smaller emoji orbiting the planet.
 * Similar to SatelliteEffect but for a single Text object that mirrors the parent's appearance.
 */
export class MiniMoonEffect {
    private scene: Phaser.Scene;
    private planet: PlanetData;
    private miniMoon: Phaser.GameObjects.Text;
    private updateListener: () => void;

    // Orbital parameters
    private orbitRadius: number = 50;
    private orbitSpeed: number = 0.02;
    private currentAngle: number = 0;
    private orbitTilt: number = 0;

    // Config
    private sizeScale: number = 0.4; // 40% of parent size
    private tint?: number;

    constructor(scene: Phaser.Scene, planet: PlanetData, config: {
        tint?: number,
        tilt?: number,
        size?: number,
        orbitRadius?: number,
        orbitSpeed?: number,
        startAngle?: number
    } = {}) {
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

        // Create the text object
        this.miniMoon = this.scene.add.text(0, 0, '🌕', {
            fontSize: '48px', // Base size, will be scaled down
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);

        // Defer tint application to ensure postFX is ready
        this.scene.time.delayedCall(100, () => {
            this.applyTint();
        });

        // Create update listener
        this.updateListener = () => this.update();
        this.scene.events.on('update', this.updateListener);
    }

    private applyTint() {
        const tint = this.tint ?? this.planet.tint;
        if (tint === undefined) return;

        // Clear any existing tint and postFX
        this.miniMoon.clearTint();
        this.miniMoon.postFX.clear();

        // Use postFX color matrix approach (same as AdjustableMoonVisual)
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

    private update() {
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

        this.miniMoon.setPosition(screenX, screenY);

        // Scale based on Z depth
        const normalizedZ = (tiltedZ / this.orbitRadius + 1) / 2; // 0..1
        const depthScale = 0.8 + (normalizedZ * 0.4); // vary size slightly

        const finalScale = this.sizeScale * parentScale * depthScale;
        this.miniMoon.setScale(finalScale);

        // Rotation (fixed angle like parent)
        this.miniMoon.setAngle(45);

        // Depth sorting
        // Parent is usually at depth 1. 
        // We want to be behind (0.9) or in front (1.1)
        const isFront = tiltedZ > 0;
        this.miniMoon.setDepth(isFront ? 1.1 : 0.9);

        // Alpha - slightly fade when behind
        this.miniMoon.setAlpha(isFront ? 1.0 : 0.7);
    }

    public setVisible(visible: boolean) {
        this.miniMoon.setVisible(visible);
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        this.miniMoon.destroy();
    }
}
