import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import type { BaseEffectConfig, IPlanetEffect } from '../planet-effect';

export interface BaseSurfaceStructureConfig extends BaseEffectConfig {
    rotationSpeed?: number;
    rotationAxis?: { x: number, y: number, z: number };
    enableShading?: boolean;
}

export interface BaseStructureItem {
    position: Phaser.Math.Vector3; // Unit vector on sphere
}

export abstract class BaseSurfaceStructureEffect<TConfig extends BaseSurfaceStructureConfig, TItem extends BaseStructureItem> implements IPlanetEffect {
    protected scene: Phaser.Scene;
    protected planet: PlanetData;
    protected config: TConfig;
    protected graphics: Phaser.GameObjects.Graphics;
    protected items: TItem[] = [];
    protected updateListener: () => void;
    protected rotationAxis!: Phaser.Math.Vector3;

    protected readonly PLANET_RADIUS = 22;

    constructor(scene: Phaser.Scene, planet: PlanetData, config: TConfig) {
        this.scene = scene;
        this.planet = planet;
        this.config = config;

        this.graphics = this.scene.add.graphics();
        this.graphics.setDepth(10);

        this.initRotation();
        this.generateItems();

        this.updateListener = () => this.onUpdate();
        this.scene.events.on('update', this.updateListener);

        // Initial visibility based on planet hidden state
        if (this.planet.hidden ?? true) {
            this.setVisible(false);
        }
    }

    protected initRotation() {
        if (this.config.rotationAxis) {
            this.rotationAxis = new Phaser.Math.Vector3(this.config.rotationAxis.x, this.config.rotationAxis.y, this.config.rotationAxis.z).normalize();
        } else {
            this.rotationAxis = new Phaser.Math.Vector3(0, 1, 0);
        }
    }

    protected lightVector: Phaser.Math.Vector3 = new Phaser.Math.Vector3(0, 0, 1);

    protected updateLightVector() {
        if (this.config.enableShading === false) return;

        // Default to front-lit if undefined
        if (this.planet.lightPhase === undefined) {
            this.lightVector.set(0, 0, 1);
            return;
        }

        // Phase 0 = Full Moon (Front Lit)
        // Cycle is 8 frames. 360 / 8 = 45 degrees.
        // Rotation is clockwise (negative angle) from front?
        // Let's deduce:
        // 0: (0,0,1)
        // 2: Left Lit (-1,0,0) -> Angle 270 (-90)?
        // 4: Back Lit (0,0,-1) -> Angle 180?
        // 6: Right Lit (1,0,0) -> Angle 90?

        // Angle = -phase * 45 degrees
        const angleDeg = -this.planet.lightPhase * 45;
        const angleRad = Phaser.Math.DegToRad(angleDeg);

        // Base vector (unrotated planet sprite)
        // Z is cos, X is sin?
        // 0 -> Z=1, X=0.
        // -90 -> Z=0, X=-1. Correct.
        const bx = Math.sin(angleRad);
        const bz = Math.cos(angleRad);

        // Planet sprite is rotated 45 degrees clockwise.
        // We need to rotate the LIGHT vector by 45 degrees to match the coordinate system?
        // Or rather, the "Left" of the sprite coincides with Top-Left on screen.
        // So the vector (-1, 0, 0) should become (-0.7, -0.7, 0).
        // Usage of rotation: X' = X*cos(45) - Y*sin(45).
        // Since Y is 0 for our base vector (equatorial lighting), Y plays no part.
        // Wait, we are rotating around Z axis (Screen).
        // Light Vector is 3D (X, Y, Z).
        // Rotation is 45 deg Clockwise? `setAngle(45)`.
        // Clockwise rotation matrix:
        // | cos  sin 0 |
        // | -sin cos 0 |
        // | 0    0   1 |
        // angle = 45 deg.
        // NewX = x*cos(45) + y*sin(45) ... wait, clockwise is negative usually?
        // Phaser setAngle(45) is typically Clockwise.
        // So we rotate the light vector by 45 degrees clockwise as well to align with the visual.
        // Actually, if the sprite rotates, the "Light Source" relative to the sprite stays fixed?
        // No, the light source is external (Sun). The moon phases represent the Sun moving relative to the Moon.
        // But here we are simulating that logic.
        // Let's just rotate -45 and +45 until it looks right if unsure, but derivation suggests:
        // "Left" (-1, 0, 0) should align with "Top-Left" (-0.7, -0.7, 0).
        // This is a -135 deg direction (from X axis).
        // -180 is Left. -135 is Bottom-Left? No.
        // Left is 180 deg?
        // Top-Left is 225 deg?
        // (-1, 0) -> (-0.7, -0.7) is a +45 deg rotation?
        // If (-1, 0) is 180 deg. +45 = 225 (-135).
        // Let's assume +45 deg rotation.

        const rot = Phaser.Math.DegToRad(45);
        const ca = Math.cos(rot);
        const sa = Math.sin(rot);

        const lx = bx * ca; // - by * sa (by=0)
        const ly = bx * sa; // + by * ca (by=0)
        const lz = bz;

        this.lightVector.set(lx, ly, lz);
    }

    protected calculateLighting(nx: number, ny: number, nz: number): number {
        if (this.config.enableShading === false) return 1.0;

        const normalVec = new Phaser.Math.Vector3(nx, ny, nz);
        const dot = normalVec.dot(this.lightVector);

        // Ambient light 0.2, full light 1.0
        // Soft terminator between -0.2 and 0.2
        if (dot < 0.2) {
            if (dot < -0.2) {
                return 0.2; // Shadow ambient
            } else {
                // Smooth transition
                const t = (dot - (-0.2)) / 0.4;
                return 0.2 + 0.8 * t;
            }
        }
        return 1.0;
    }

    protected abstract generateItems(): void;

    protected onUpdate() {
        // Skip update if planet is hidden
        if (this.planet.hidden ?? true) {
            return;
        }

        if (!this.planet.gameObject) return;

        this.graphics.clear();

        const scale = this.planet.visualScale || 1.0;
        const planetRadius = this.PLANET_RADIUS * scale;
        const cx = this.planet.x;
        const cy = this.planet.y;

        // Rotation
        const rotSpeed = this.config.rotationSpeed ?? 0.005;

        // Auto-update rotation axis from planet visual if not explicitly configured
        if (!this.config.rotationAxis && this.planet.gameObject) {
            // Default axis (0, 1, 0)

            // Apply planet rotation (Screen Z axis rotation)
            // Note: Planet visual rotation is usually in radians
            const angle = this.planet.gameObject.rotation;

            // Rotate (0, 1, 0) by angle around Z
            // x' = x*cos - y*sin
            // y' = x*sin + y*cos
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);

            // relative to (0,1,0):
            const nx = -sin; // 0*cos - 1*sin
            const ny = cos;  // 0*sin + 1*cos

            this.rotationAxis.set(nx, ny, 0).normalize();
        }

        const deltaRot = new Phaser.Math.Quaternion();
        deltaRot.setAxisAngle(this.rotationAxis, rotSpeed);

        this.updateLightVector();

        this.items.forEach(item => {
            // Rotate position
            item.position.transformQuat(deltaRot);

            // Optional: normalize to prevent drift
            // item.position.normalize(); 

            // Hook for subclass to transform extra properties (e.g. tangent for rectangles)
            this.transformItem(item, deltaRot);
        });

        // Sorting items by Z-depth for correct rendering order
        // Sort from back (low Z) to front (high Z)
        // Assumption: View is looking down Z axis? Or Z is depth coming OUT?
        // In the original code: 
        // Spikes didn't sort explicitly? It just did forEach.
        // Rectangles sorted: a.position.z - b.position.z.
        // Let's implement sorting as it's generally good for depth effects.
        // We might want to make this optional if performance is key and order doesn't matter (like thin lines).
        // But for consistency let's sort.
        const sortedItems = [...this.items].sort((a, b) => a.position.z - b.position.z);

        sortedItems.forEach(item => {
            this.drawItem(item, cx, cy, planetRadius, scale);
        });
    }

    protected transformItem(item: TItem, deltaRot: Phaser.Math.Quaternion) {
        // Override in subclass if needed
        // Avoid lint errors for unused params in default implementation
        void item;
        void deltaRot;
    }

    protected abstract drawItem(item: TItem, centerX: number, centerY: number, planetRadius: number, scale: number): void;

    public setVisible(visible: boolean) {
        this.graphics.setVisible(visible);
    }

    public setDepth(depth: number) {
        this.graphics.setDepth(depth);
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        this.graphics.destroy();
    }
}
