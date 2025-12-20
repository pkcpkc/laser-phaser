import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';
import type { BaseEffectConfig, IPlanetEffect } from '../planet-effect';

export interface BaseSurfaceStructureConfig extends BaseEffectConfig {
    rotationSpeed?: number;
    rotationAxis?: { x: number, y: number, z: number };
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
    }

    protected initRotation() {
        if (this.config.rotationAxis) {
            this.rotationAxis = new Phaser.Math.Vector3(this.config.rotationAxis.x, this.config.rotationAxis.y, this.config.rotationAxis.z).normalize();
        } else {
            this.rotationAxis = new Phaser.Math.Vector3(0, 1, 0);
        }
    }

    protected abstract generateItems(): void;

    protected onUpdate() {
        if (!this.planet.gameObject) return;

        this.graphics.clear();

        const scale = this.planet.visualScale || 1.0;
        const planetRadius = this.PLANET_RADIUS * scale;
        const cx = this.planet.x;
        const cy = this.planet.y;

        // Rotation
        const rotSpeed = this.config.rotationSpeed ?? 0.005;
        const deltaRot = new Phaser.Math.Quaternion();
        deltaRot.setAxisAngle(this.rotationAxis, rotSpeed);

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

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        this.graphics.destroy();
    }
}
