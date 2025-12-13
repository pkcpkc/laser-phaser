import Phaser from 'phaser';
import { BasePlanetVisual } from './base-planet-visual';
import type { PlanetData } from '../planet-registry';

export class RingWorldVisual extends BasePlanetVisual {

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        super(scene, planet);
    }

    public create(onClick: (planet: PlanetData) => void): void {
        const initialVisual = (this.planet.unlocked || this.planet.type === 'main') ? this.planet.visual : '🌑';

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

    public update(_time: number, _delta: number): void {
        // Ring world might rotate slowly or just be static
    }

    public animate(): void {
        // No phase animation for Ring World
    }

    public override updateVisibility(): void {
        super.updateVisibility();

        if (this.planet.unlocked && this.planet.gameObject instanceof Phaser.GameObjects.Text) {
            // Ensure the visual is updated from the locked state
            this.planet.gameObject.setText(this.planet.visual);

            if (this.planet.overlayGameObject) {
                this.planet.overlayGameObject.setText(this.planet.visual);
            }
        }
    }
}
