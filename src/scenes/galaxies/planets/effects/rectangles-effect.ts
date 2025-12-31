import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import { BaseSurfaceStructureEffect, type BaseStructureItem, type BaseSurfaceStructureConfig } from './base-surface-structure-effect';

export interface RectanglesConfig extends BaseSurfaceStructureConfig {
    type: 'rectangles';
    rectCount?: number;
    color?: number;
    minSize?: number;
    maxSize?: number;
    lightsColor?: number;
    clusterCount?: number;
}

interface RectangleItem extends BaseStructureItem {
    width: number;
    height: number;
    color: number;
    // Orientation angle on the surface tangent plane (radians)
    angle: number;
}

export class RectanglesEffect extends BaseSurfaceStructureEffect<RectanglesConfig, RectangleItem> {
    public static readonly effectType = 'rectangles';

    constructor(scene: Phaser.Scene, planet: PlanetData, config: RectanglesConfig) {
        super(scene, planet, config);
    }

    protected generateItems() {
        const count = this.config.rectCount || 50;
        const color = this.config.color ?? 0x00ffff;
        const minSize = this.config.minSize || 2.0;
        const maxSize = this.config.maxSize || 6.0;

        // Clustering setup
        const requestedClusters = this.config.clusterCount || 0;
        const useClusters = requestedClusters > 0;
        const clusterCount = requestedClusters;
        const centers: Phaser.Math.Vector3[] = [];

        if (useClusters) {
            for (let i = 0; i < clusterCount; i++) {
                // Random center
                const u = Math.random();
                const v = Math.random();
                const theta = 2 * Math.PI * u;
                const phi = Math.acos(2 * v - 1);
                const x = Math.sin(phi) * Math.cos(theta);
                const y = Math.sin(phi) * Math.sin(theta);
                const z = Math.cos(phi);
                centers.push(new Phaser.Math.Vector3(x, y, z));
            }
        }

        for (let i = 0; i < count; i++) {
            let pos: Phaser.Math.Vector3;

            if (useClusters) {
                // Pick a random cluster
                const center = centers[Math.floor(Math.random() * centers.length)];

                // Generate a random offset (spread)
                // Use a smaller spread to simulate density
                // Spread angle approx 20-30 degrees?
                const spread = 0.3; // Approx radius in 3D unit sphere chord length

                // Method: Pick a random point in a ball around the center, then project to sphere
                // Or just: random vector * factor + center, then normalize.

                const rx = (Math.random() - 0.5) * spread;
                const ry = (Math.random() - 0.5) * spread;
                const rz = (Math.random() - 0.5) * spread;

                pos = new Phaser.Math.Vector3(center.x + rx, center.y + ry, center.z + rz).normalize();
            } else {
                // Random point on sphere
                const u = Math.random();
                const v = Math.random();
                const theta = 2 * Math.PI * u;
                const phi = Math.acos(2 * v - 1);
                const x = Math.sin(phi) * Math.cos(theta);
                const y = Math.sin(phi) * Math.sin(theta);
                const z = Math.cos(phi);
                pos = new Phaser.Math.Vector3(x, y, z);
            }

            this.items.push({
                position: pos,
                width: Phaser.Math.FloatBetween(minSize, maxSize),
                height: Phaser.Math.FloatBetween(minSize, maxSize),
                color: color,
                angle: Math.random() * Math.PI * 2
            });
        }
    }

    protected drawItem(rect: RectangleItem, cx: number, cy: number, planetRadius: number, scale: number) {
        const nx = rect.position.x;
        const ny = rect.position.y;
        const nz = rect.position.z;

        // Fading logic at horizon
        let alpha = 1.0;
        // Start fading earlier to make it gentle
        const fadeStart = 0.5;
        const fadeEnd = 0.1;

        if (nz < fadeStart) {
            if (nz < fadeEnd) {
                alpha = 0;
            } else {
                // Smooth easing
                const t = (nz - fadeEnd) / (fadeStart - fadeEnd);
                alpha = t * t;
            }
        }

        if (alpha <= 0.01) return;

        // --- 3D Projection Logic ---

        // 1. Define basis vectors for the tangent plane at (nx, ny, nz)
        // Normal vector N = (nx, ny, nz)
        // We need two orthogonal vectors U and V on the tangent plane.
        // Let's choose an arbitrary "up" vector (world Y) to compute U and V, 
        // unless N is parallel to "up".

        const normal = new Phaser.Math.Vector3(nx, ny, nz);
        const up = new Phaser.Math.Vector3(0, 1, 0);

        // If normal is too close to up, pick another reference (e.g., world X)
        if (Math.abs(normal.dot(up)) > 0.99) {
            up.set(1, 0, 0);
        }

        // U = Up x N (Cross product)
        const uVec = new Phaser.Math.Vector3();
        uVec.copy(up).cross(normal).normalize();

        // V = N x U
        const vVec = new Phaser.Math.Vector3();
        vVec.copy(normal).cross(uVec).normalize();

        // 2. Rotate U and V by rect.angle around N (the normal)
        // Actually, we can just define the 4 corners in "UV" space and them rotate them conceptually
        // OR rotate U and V themselves. 
        // Let's compute rotated basis vectors U' and V'.
        // U' = U * cos(angle) + V * sin(angle)
        // V' = -U * sin(angle) + V * cos(angle)

        const cosA = Math.cos(rect.angle);
        const sinA = Math.sin(rect.angle);

        const uPrime = uVec.clone().scale(cosA).add(vVec.clone().scale(sinA));
        const vPrime = uVec.clone().scale(-sinA).add(vVec.clone().scale(cosA));

        // 3. Define 4 corners in 3D relative to the center position (nx, ny, nz) * planetRadius
        // Half sizes
        // Note: Using 'scale' for size adjustment based on zoom/visualScale
        const hw = (rect.width * scale) / 2;
        const hh = (rect.height * scale) / 2;

        // We assume the rectangle is flat on the tangent plane.
        // But since it's "bending", we actually want to project these simple 3D points 
        // and let the sphere normal projection handle the "bending" naturally? 
        // The user said "rectangles should 'bend' when reaching the horizon".
        // A flat rectangle in 3D space tangent to a sphere will look like a flat plate.
        // As it rotates to the horizon, it will foreshorten.
        // If we draw it as a quad of 4 projected points, it will naturally have perspective distortion.

        // Center of rect in World coordinates (relative to planet center)
        // For drawing, we are working in a "view" space where Z is depth?
        // Wait, the 'drawItem' gets raw x,y,z on the unit sphere (nx, ny, nz).
        // Since we are projecting everything manually to 2D screen (cx, cy), we are doing a simplified projection.
        // We treat (nx, ny, nz) as 3D coords.
        // Z is depth (positive towards viewer? or positive away? Base code suggests nz > 0 is front).

        // Let's calculate the 3D offsets for the 4 corners.
        // Corner = Center + (w/2)*U' + (h/2)*V'  etc.

        const corners: { x: number, y: number, z: number }[] = [
            { u: -1, v: -1 },
            { u: 1, v: -1 },
            { u: 1, v: 1 },
            { u: -1, v: 1 }
        ].map(offset => {
            const dU = uPrime.clone().scale(offset.u * hw);
            const dV = vPrime.clone().scale(offset.v * hh);
            const cornerPos = new Phaser.Math.Vector3(nx * planetRadius, ny * planetRadius, nz * planetRadius)
                .add(dU)
                .add(dV);
            return cornerPos;
        });

        // 4. Project 3D points to 2D screen space
        // We need to handle perspective scaling if we want true "bending" look?
        // Simple orthographic projection: x_screen = x, y_screen = y.
        // User wants "3d like effect", "bending".
        // Perspective projection: x_screen = x / (z + d)
        // However, our base system might be just orthographic for the planet sphere itself (it interacts with simple 2D circle masks).
        // But if we just draw the 4 points as (x, y) relative to center, it will look like a 3D plate rotating.
        // Let's try simple orthogonal X,Y first, because "bending" at horizon naturally comes from 
        // the fact that points "behind" the horizon will have different X/Y than points "in front".

        // Wait, if we use pure orthogonal (drop Z), a rectangle at horizon (side view) becomes a line.
        // That IS the bending effect basically.

        // Lighting check
        const lightFactor = this.calculateLighting(nx, ny, nz);

        // Apply lighting to color (darken)
        // Extract RGB
        const r = (rect.color >> 16) & 0xFF;
        const g = (rect.color >> 8) & 0xFF;
        const b = rect.color & 0xFF;

        const finalR = Math.floor(r * lightFactor);
        const finalG = Math.floor(g * lightFactor);
        const finalB = Math.floor(b * lightFactor);
        const finalColor = (finalR << 16) | (finalG << 8) | finalB;

        this.graphics.fillStyle(finalColor, alpha);

        this.graphics.beginPath();

        corners.forEach((c, index) => {
            // Apply scale
            const px = cx + c.x;
            const py = cy + c.y;

            if (index === 0) this.graphics.moveTo(px, py);
            else this.graphics.lineTo(px, py);
        });

        this.graphics.closePath();
        this.graphics.fillPath();

        // City lights logic
        // Only draw if config is present and it is dark (lightFactor < threshold)
        if (this.config.lightsColor !== undefined) {
            // Light factor ranges from 0.2 (dark) to 1.0 (bright)
            // We want lights to appear when it gets dark.
            // Let's say lights start appearing at 0.5 and are fully bright at 0.2.
            const threshold = 0.5;
            if (lightFactor < threshold) {
                // Map range [0.2, 0.5] to alpha [1.0, 0.0]
                // val = lightFactor
                // alpha = (threshold - val) / (threshold - min)
                const minLight = 0.2;
                const range = threshold - minLight;
                const t = (threshold - lightFactor) / range;
                const lightsAlpha = Phaser.Math.Clamp(t, 0, 1);

                if (lightsAlpha > 0) {
                    // Draw lights at corners only
                    this.graphics.fillStyle(this.config.lightsColor, lightsAlpha * alpha);
                    corners.forEach(c => {
                        const px = cx + c.x;
                        const py = cy + c.y;
                        // Small dot size 1.5 scaled
                        this.graphics.fillCircle(px, py, 1.5 * scale); // 1.5 * scale radius
                    });
                }
            }
        }

    }
}
