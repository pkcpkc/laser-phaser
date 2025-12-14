import Phaser from 'phaser';
import { BasePlanetVisual } from './base-planet-visual';
import type { PlanetData } from '../planet-registry';

export class EarthVisual extends BasePlanetVisual {
    private frames = ['🌎', '🌍', '🌏'];
    private frameIdx = 0;

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        super(scene, planet);
    }

    public create(onClick: (planet: PlanetData) => void): void {
        const visualObject = this.scene.add.text(this.planet.x, this.planet.y, this.frames[0], {
            fontSize: '48px',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);

        // Overlay for cross-fading
        const overlay = this.scene.add.text(this.planet.x, this.planet.y, this.frames[0], {
            fontSize: '48px',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);
        overlay.setAlpha(0);
        this.planet.overlayGameObject = overlay;
        this.planet.usingOverlay = false;

        visualObject.setInteractive({ useHandCursor: true });
        visualObject.on('pointerdown', () => onClick(this.planet));

        // Also make overlay interactive so it catches clicks when visible
        overlay.setInteractive({ useHandCursor: true });
        overlay.on('pointerdown', () => onClick(this.planet));

        this.planet.gameObject = visualObject;

        // Locked effect if needed (Earth usually unlocked though)
        if (!this.planet.unlocked) {
            this.addLockedParticleEffect();
        }

        // Start animation timer
        // Adjust speed based on size: Larger = Slower (Higher Delay)
        // Base delay 500ms for scale 1.0
        const scale = this.planet.visualScale || 1.0;
        const delay = 500 * scale;

        this.scene.time.addEvent({
            delay: delay,
            loop: true,
            callback: () => this.animate()
        });
    }

    public update(_time: number, _delta: number): void {
        // No per-frame update needed for now
    }

    public animate(): void {
        if (!this.planet.gameObject || !(this.planet.gameObject instanceof Phaser.GameObjects.Text)) return;

        // If we somehow don't have the overlay (legacy or error), fallback to snap
        if (!this.planet.overlayGameObject) {
            this.frameIdx = (this.frameIdx + 1) % this.frames.length;
            const newFrame = this.frames[this.frameIdx];
            this.planet.gameObject.setText(newFrame);
            return;
        }

        this.frameIdx = (this.frameIdx + 1) % this.frames.length;
        const newFrame = this.frames[this.frameIdx];

        const main = this.planet.gameObject;
        const overlay = this.planet.overlayGameObject;
        const targetObj = this.planet.usingOverlay ? main : overlay;
        const sourceObj = this.planet.usingOverlay ? overlay : main;

        targetObj.setText(newFrame);

        // Ensure target is fully visible and source fades out
        this.scene.tweens.killTweensOf(targetObj);
        this.scene.tweens.killTweensOf(sourceObj);

        this.scene.tweens.add({
            targets: targetObj,
            alpha: 1,
            duration: 800, // Slower fade for Earth (was 400 for moon)
            ease: 'Linear'
        });

        this.scene.tweens.add({
            targets: sourceObj,
            alpha: 0,
            duration: 800,
            ease: 'Linear'
        });

        this.planet.usingOverlay = !this.planet.usingOverlay;

        // Earth text override if unlocked (though Earth is main)
        if (this.planet.unlocked && this.planet.id === 'earth') {
            // ensure purely visual update, no logic change
        }
    }

    public override updateVisibility(): void {
        super.updateVisibility();
        if (this.planet.unlocked && this.planet.gameObject instanceof Phaser.GameObjects.Text && this.planet.id === 'earth') {
            // Ensure it doesn't get stuck on moon emoji if logic failed elsewhere
        }
    }
}
