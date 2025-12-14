import Phaser from 'phaser';
import { BasePlanetVisual } from './base-planet-visual';
import type { PlanetData } from '../planet-registry';

export class RingWorldVisual extends BasePlanetVisual {

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        super(scene, planet);
    }

    public create(onClick: (planet: PlanetData) => void): void {
        const initialVisual = '🌑'; // Always moon emoji

        const visualObject = this.scene.add.text(this.planet.x, this.planet.y, initialVisual, {
            fontSize: '48px',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);

        // Simple overlay for cross-fading unlock reveal
        const overlay = this.scene.add.text(this.planet.x, this.planet.y, initialVisual, {
            fontSize: '48px',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);
        overlay.setAlpha(0);
        this.planet.overlayGameObject = overlay;
        this.planet.usingOverlay = false;

        if (this.planet.visualScale) {
            const targetScale = this.planet.unlocked ? this.planet.visualScale : 0.8;
            visualObject.setScale(targetScale);
            overlay.setScale(targetScale);
        }

        visualObject.setInteractive({ useHandCursor: true }).on('pointerdown', () => onClick(this.planet));
        overlay.setInteractive({ useHandCursor: true }).on('pointerdown', () => onClick(this.planet));

        this.planet.gameObject = visualObject;

        if (!this.planet.unlocked) {
            this.addLockedParticleEffect();
        }
    }

    public update(_time: number, delta: number): void {
        const visual = this.planet.gameObject;
        if (!visual || !(visual instanceof Phaser.GameObjects.Text)) return;

        // Rotation speed inversely proportional to size
        const scale = this.planet.visualScale || 1.0;
        const baseSpeed = 0.02; // degrees per ms
        const speed = baseSpeed / scale;

        visual.angle += speed * delta;

        if (this.planet.overlayGameObject) {
            this.planet.overlayGameObject.angle = visual.angle;
        }
    }

    public animate(): void {
        // No phase animation for Ring World
    }

    public override updateVisibility(): void {
        super.updateVisibility();

        // Visual doesn't change, already '🌑'
    }
}
