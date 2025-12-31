import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import { BaseSurfaceStructureEffect, type BaseStructureItem, type BaseSurfaceStructureConfig } from './base-surface-structure-effect';

export interface SpikesConfig extends BaseSurfaceStructureConfig {
    type: 'spikes';
    buildingCount?: number;
    color?: number;
    minHeight?: number;
    maxHeight?: number;
}

interface Building extends BaseStructureItem {
    height: number;
    width: number;
    color: number;
    phase: number;
    speed: number;
}

export class SpikesEffect extends BaseSurfaceStructureEffect<SpikesConfig, Building> {
    public static readonly effectType = 'spikes';

    constructor(scene: Phaser.Scene, planet: PlanetData, config: SpikesConfig) {
        super(scene, planet, config);
        // Explicitly disable shading for Spikes unless overruled?
        // User requested: "explicitly disable within spikes-effect code"
        this.config.enableShading = false;
    }

    protected generateItems() {
        const count = this.config.buildingCount || 50;
        const color = this.config.color ?? 0x00ffff;
        const minH = this.config.minHeight || 2.0;
        const maxH = this.config.maxHeight || 6.0;

        for (let i = 0; i < count; i++) {
            // Random point on sphere
            // Uniform distribution on sphere
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);

            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);

            const pos = new Phaser.Math.Vector3(x, y, z);

            this.items.push({
                position: pos,
                height: Phaser.Math.FloatBetween(minH, maxH),
                width: Phaser.Math.FloatBetween(0.5, 1.5),
                color: color,
                phase: Math.random() * Math.PI * 2,
                speed: Phaser.Math.FloatBetween(0.8, 1.2)
            });
        }
    }

    protected drawItem(b: Building, cx: number, cy: number, planetRadius: number, scale: number) {
        const nx = b.position.x;
        const ny = b.position.y;
        const nz = b.position.z;

        // Fading / Shrinking logic at horizon
        let alpha = 1.0;
        let sizeFactor = 1.0;
        const fadeStart = 0.35;
        const fadeEnd = 0.05;

        if (nz < fadeStart) {
            if (nz < fadeEnd) {
                alpha = 0;
                sizeFactor = 0;
            } else {
                const t = (nz - fadeEnd) / (fadeStart - fadeEnd);
                alpha = t * t;
                sizeFactor = t;
            }
        }

        if (alpha <= 0.01) return;

        // Base position (on surface)
        const baseX = cx + nx * planetRadius;
        const baseY = cy + ny * planetRadius;

        // Tip position
        const time = this.scene.time.now;
        // Gentle sine wave animation: varies from ~0.6x to ~1.4x height
        const pulse = Math.sin(time * 0.002 * b.speed + b.phase);
        const heightMultiplier = 1.0 + 0.4 * pulse;

        const effectiveHeight = b.height * sizeFactor * heightMultiplier;
        const tipRadius = planetRadius + (effectiveHeight * scale);
        const tipX = cx + nx * tipRadius;
        const tipY = cy + ny * tipRadius;

        // Lighting calculation
        const lightFactor = this.calculateLighting(nx, ny, nz);

        const r = (b.color >> 16) & 0xFF;
        const g = (b.color >> 8) & 0xFF;
        const blue = b.color & 0xFF;
        const fr = Math.floor(r * lightFactor);
        const fg = Math.floor(g * lightFactor);
        const fb = Math.floor(blue * lightFactor);
        const finalColor = (fr << 16) | (fg << 8) | fb;

        this.graphics.lineStyle(b.width * scale * sizeFactor, finalColor, alpha);
        this.graphics.lineBetween(baseX, baseY, tipX, tipY);
    }
}
