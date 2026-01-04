import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import { BaseSurfaceStructureEffect, type BaseStructureItem, type BaseSurfaceStructureConfig } from './base-surface-structure-effect';

export interface BubbleConfig extends BaseSurfaceStructureConfig {
    type: 'bubble';
    liquidDensity?: number;
    flowSpeed?: number;
}

interface BubbleCell extends BaseStructureItem {
    // Base scale or size
    baseSize: number;
    // Random offsets for noise
    noiseOffsetX: number;
    noiseOffsetY: number;
    noiseOffsetZ: number;
}

export class BubbleEffect extends BaseSurfaceStructureEffect<BubbleConfig, BubbleCell> {
    public static readonly effectType = 'bubble';

    constructor(scene: Phaser.Scene, planet: PlanetData, config: BubbleConfig) {
        super(scene, planet, config);
    }

    protected generateItems() {
        const count = this.config.liquidDensity || 800; // Dense for liquid look

        // Fibonacci Sphere Algorithm for even distribution
        const goldenRatio = (1 + Math.sqrt(5)) / 2;

        for (let i = 0; i < count; i++) {
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / count);

            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);

            const pos = new Phaser.Math.Vector3(x, y, z);

            this.items.push({
                position: pos,
                baseSize: Phaser.Math.FloatBetween(0.8, 1.2),
                noiseOffsetX: Math.random() * 100,
                noiseOffsetY: Math.random() * 100,
                noiseOffsetZ: Math.random() * 100
            });
        }
    }

    protected drawItem(_graphics: Phaser.GameObjects.Graphics, cell: BubbleCell, cx: number, cy: number, planetRadius: number, scale: number) {
        const nx = cell.position.x;
        const ny = cell.position.y;
        const nz = cell.position.z;

        // Strict back-face culling for performance
        if (nz < 0.1) return;

        // Lighting
        const light = this.calculateLighting(nx, ny, nz);

        // Animation Param: Time
        const time = this.scene.time.now / 1000;
        const speed = this.config.flowSpeed || 0.8;
        const t = time * speed;

        // Organic Bubble Movement
        const freq = 6.0;

        // 3D Noise-like using Sines
        const val1 = Math.sin(nx * freq + t + cell.noiseOffsetX);
        const val2 = Math.sin(ny * freq * 1.2 + t + cell.noiseOffsetY);
        const val3 = Math.sin(nz * freq * 1.5 + t + cell.noiseOffsetZ);

        // Initial value range roughly [-3, 3], normalize to [0, 1]
        const rawVal = (val1 + val2 + val3) / 3;
        const fluidVal = (rawVal + 1) / 2; // ~ 0 to 1

        // Use fluidVal to modulate size and alpha
        const peakVal = Math.pow(fluidVal, 2);

        const sizeMod = 0.2 + (1.6 * peakVal);
        // Larger base radius
        const drawRadius = 3.0 * scale * cell.baseSize * sizeMod;

        // Alpha modulation - high contrast
        let alpha = 0.3 + (0.7 * peakVal);

        // Fade at edges
        if (nz < 0.3) {
            alpha *= (nz - 0.05) / 0.25;
        }

        if (alpha <= 0.01) return;

        // Color blending derived from Planet Tint
        const baseColor = this.planet.tint ?? 0xffffff;

        // Generate a lighter/brighter/secondary color from base
        // Simple HSL shift or just additive mixing
        const r1 = (baseColor >> 16) & 0xFF;
        const g1 = (baseColor >> 8) & 0xFF;
        const b1 = baseColor & 0xFF;

        // Make secondary color significantly brighter/shifted
        const r2 = Math.min(255, r1 + 100);
        const g2 = Math.min(255, g1 + 100);
        const b2 = Math.min(255, b1 + 100);

        // Sharp mixing curve
        const mix = Math.pow(fluidVal, 3); // Only highest peaks get secondary color

        const rMixed = r1 + (r2 - r1) * mix;
        const gMixed = g1 + (g2 - g1) * mix;
        const bMixed = b1 + (b2 - b1) * mix;

        // Apply Lighting
        // Extreme specular: brighten significantly in light
        const rLit = Math.min(255, Math.floor(rMixed * light * 1.2));
        const gLit = Math.min(255, Math.floor(gMixed * light * 1.2));
        const bLit = Math.min(255, Math.floor(bMixed * light * 1.2));

        const finalColor = (rLit << 16) | (gLit << 8) | bLit;

        this.graphics.fillStyle(finalColor, alpha);

        // Project position
        const px = cx + nx * planetRadius;
        const py = cy + ny * planetRadius;

        // Draw Blob
        this.graphics.fillCircle(px, py, drawRadius);

        // Extreme Highlight
        if (peakVal > 0.7 && alpha > 0.4) {
            this.graphics.fillStyle(0xffffff, alpha * 0.6);
            this.graphics.fillCircle(px - drawRadius * 0.2, py - drawRadius * 0.2, drawRadius * 0.4);
        }
    }
}
