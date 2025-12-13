import Phaser from 'phaser';
import { BasePlanetVisual } from './base-planet-visual';
import type { PlanetData } from '../planet-registry';

export class AdjustableMoonVisual extends BasePlanetVisual {
    private moonFrames = ['🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔'];
    private frameIdx = 0;

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        super(scene, planet);
    }

    public create(onClick: (planet: PlanetData) => void): void {
        const initialVisual = (this.planet.unlocked) ? this.planet.visual : '🌑';

        const visualObject = this.scene.add.text(this.planet.x, this.planet.y, initialVisual, {
            fontSize: '48px',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);

        // Overlay for cross-fading
        const overlay = this.scene.add.text(this.planet.x, this.planet.y, initialVisual, {
            fontSize: '48px',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);
        overlay.setAlpha(0);
        this.planet.overlayGameObject = overlay;
        this.planet.usingOverlay = false;

        this.applyVisualProperties(visualObject, overlay);

        visualObject.setInteractive({ useHandCursor: true }).on('pointerdown', () => onClick(this.planet));
        overlay.setInteractive({ useHandCursor: true }).on('pointerdown', () => onClick(this.planet));

        this.planet.gameObject = visualObject;

        if (!this.planet.unlocked) {
            this.addLockedParticleEffect();
        }

        // Start animation loop
        this.scene.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => this.animate()
        });
    }

    private applyVisualProperties(obj1: Phaser.GameObjects.Text, obj2: Phaser.GameObjects.Text) {
        if (this.planet.tint && this.planet.unlocked) {
            obj1.setTint(this.planet.tint);
            obj2.setTint(this.planet.tint);
        }
        if (this.planet.angle) {
            obj1.setAngle(this.planet.angle);
            obj2.setAngle(this.planet.angle);
        }
        if (this.planet.visualScale) {
            const targetScale = this.planet.unlocked ? this.planet.visualScale : 0.8;
            obj1.setScale(targetScale);
            obj2.setScale(targetScale);
        }
    }

    public update(_time: number, _delta: number): void {
        // 
    }

    public animate(): void {
        this.frameIdx = (this.frameIdx + 1) % this.moonFrames.length;

        let nextFrame = '🌑';
        if (this.planet.unlocked) {
            nextFrame = this.moonFrames[this.frameIdx];
        }

        this.updateVisualFrame(nextFrame);
    }

    private updateVisualFrame(newFrame: string) {
        if (!this.planet.gameObject || !(this.planet.gameObject instanceof Phaser.GameObjects.Text)) return;
        if (!this.planet.overlayGameObject) {
            this.planet.gameObject.setText(newFrame);
            return;
        }

        const main = this.planet.gameObject;
        const overlay = this.planet.overlayGameObject;
        const targetObj = this.planet.usingOverlay ? main : overlay;
        const sourceObj = this.planet.usingOverlay ? overlay : main;

        targetObj.setText(newFrame);

        // Re-apply properties in case they were lost or need refresh (e.g. tint on unlock)
        if (this.planet.unlocked && this.planet.tint) {
            targetObj.setTint(this.planet.tint);
        } else {
            targetObj.clearTint();
        }

        if (this.planet.visualScale) {
            const targetScale = this.planet.unlocked ? this.planet.visualScale : 0.8;
            targetObj.setScale(targetScale);
        }
        if (this.planet.angle) {
            targetObj.setAngle(this.planet.angle);
        }

        this.scene.tweens.killTweensOf(targetObj);
        this.scene.tweens.killTweensOf(sourceObj);

        this.scene.tweens.add({
            targets: targetObj,
            alpha: 1,
            duration: 400,
            ease: 'Linear'
        });

        this.scene.tweens.add({
            targets: sourceObj,
            alpha: 0,
            duration: 400,
            ease: 'Linear'
        });

        this.planet.usingOverlay = !this.planet.usingOverlay;
    }
}
