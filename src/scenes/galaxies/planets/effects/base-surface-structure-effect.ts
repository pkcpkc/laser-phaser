import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import type { IPlanetEffect } from '../planet-effect';

export interface BaseSurfaceStructureConfig {
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
    protected graphics: Phaser.GameObjects.Graphics; // Back layer
    protected graphicsFront: Phaser.GameObjects.Graphics; // Front layer
    protected items: TItem[] = [];
    protected updateListener: () => void;
    protected rotationAxis!: Phaser.Math.Vector3;

    protected readonly PLANET_RADIUS = 22;

    constructor(scene: Phaser.Scene, planet: PlanetData, config: TConfig) {
        this.scene = scene;
        this.planet = planet;
        this.config = config;

        this.graphics = this.scene.add.graphics();
        this.graphicsFront = this.scene.add.graphics();

        // Default depths (will be overridden)
        this.graphics.setDepth(10);
        this.graphicsFront.setDepth(12);

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

        const angleDeg = -this.planet.lightPhase * 45;
        const angleRad = Phaser.Math.DegToRad(angleDeg);

        const bx = Math.sin(angleRad);
        const bz = Math.cos(angleRad);

        const rot = Phaser.Math.DegToRad(45);
        const ca = Math.cos(rot);
        const sa = Math.sin(rot);

        const lx = bx * ca;
        const ly = bx * sa;
        const lz = bz;

        this.lightVector.set(lx, ly, lz);
    }

    protected calculateLighting(nx: number, ny: number, nz: number): number {
        if (this.config.enableShading === false) return 1.0;

        const normalVec = new Phaser.Math.Vector3(nx, ny, nz);
        const dot = normalVec.dot(this.lightVector);

        if (dot < 0.2) {
            if (dot < -0.2) {
                return 0.2;
            } else {
                const t = (dot - (-0.2)) / 0.4;
                return 0.2 + 0.8 * t;
            }
        }
        return 1.0;
    }

    protected abstract generateItems(): void;

    protected onUpdate() {
        if (this.planet.hidden ?? true) {
            return;
        }

        if (!this.planet.gameObject) return;

        this.graphics.clear();
        this.graphicsFront.clear();

        const scale = this.planet.visualScale || 1.0;
        const planetRadius = this.PLANET_RADIUS * scale;
        const cx = this.planet.x;
        const cy = this.planet.y;

        const rotSpeed = this.config.rotationSpeed ?? 0.005;

        if (!this.config.rotationAxis && this.planet.gameObject) {
            const angle = this.planet.gameObject.rotation;
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);
            const nx = -sin;
            const ny = cos;
            this.rotationAxis.set(nx, ny, 0).normalize();
        }

        const deltaRot = new Phaser.Math.Quaternion();
        deltaRot.setAxisAngle(this.rotationAxis, rotSpeed);

        this.updateLightVector();

        this.items.forEach(item => {
            item.position.transformQuat(deltaRot);
            this.transformItem(item, deltaRot);
        });

        // Determine back and front items
        // Z > 0 is Front (towards viewer), Z < 0 is Back
        // But coordinate system depends on projection.
        // Assuming Standard Right Handed: Z comes OUT of screen? Or Goes IN?
        // Phaser 3D/Mesh usually: Z is depth?
        // In this custom sphere logic, let's look at RectanglesEffect fading:
        // if (nz < fadeStart) -> when nz is small or negative?
        // Let's assume Z positive is FRONT.

        const sortedItems = [...this.items].sort((a, b) => a.position.z - b.position.z);

        sortedItems.forEach(item => {
            // Pick graphics target based on Z
            // Use a slight overlap to avoid clipping artifacts at exactly 0?
            const targetGraphics = (item.position.z >= 0) ? this.graphicsFront : this.graphics;
            this.drawItem(targetGraphics, item, cx, cy, planetRadius, scale);
        });
    }

    protected transformItem(item: TItem, deltaRot: Phaser.Math.Quaternion) {
        void item;
        void deltaRot;
    }

    protected abstract drawItem(graphics: Phaser.GameObjects.Graphics, item: TItem, centerX: number, centerY: number, planetRadius: number, scale: number): void;

    public setVisible(visible: boolean) {
        this.graphics.setVisible(visible);
        this.graphicsFront.setVisible(visible);
    }

    public setDepth(depth: number) {
        // Base depth is for the BACK layer.
        // Front layer is Base + 2 (to be in front of planet).
        this.graphics.setDepth(depth);
        this.graphicsFront.setDepth(depth + 2);
    }

    public getDepth(): number {
        return this.graphics.depth;
    }

    public getVisualElements(): Phaser.GameObjects.GameObject[] {
        return [this.graphics, this.graphicsFront];
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        this.graphics.destroy();
        this.graphicsFront.destroy();
    }
}
