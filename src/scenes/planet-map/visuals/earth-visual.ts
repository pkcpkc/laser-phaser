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
        this.planet.visual = this.frames[0]; // Ensure start frame

        const visualObject = this.scene.add.text(this.planet.x, this.planet.y, this.planet.visual, {
            fontSize: '48px',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);

        visualObject.setInteractive({ useHandCursor: true });
        visualObject.on('pointerdown', () => onClick(this.planet));

        this.planet.gameObject = visualObject;

        // Locked effect if needed (Earth usually unlocked though)
        if (!this.planet.unlocked) {
            this.addLockedParticleEffect();
        }

        // Start animation timer
        this.scene.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => this.animate()
        });
    }

    public update(_time: number, _delta: number): void {
        // No per-frame update needed for now
    }

    public animate(): void {
        if (!this.planet.gameObject || !(this.planet.gameObject instanceof Phaser.GameObjects.Text)) return;

        this.frameIdx = (this.frameIdx + 1) % this.frames.length;
        const newFrame = this.frames[this.frameIdx];

        this.planet.gameObject.setText(newFrame);

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
