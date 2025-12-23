import Phaser from 'phaser';
import type { PlanetData } from './planet-data';
// Concrete effect imports removed - PlanetVisual is now generic

export class PlanetVisual {
    protected scene: Phaser.Scene;
    protected planet: PlanetData;
    private moonFrames = ['🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔'];
    private frameIdx = 0;


    constructor(scene: Phaser.Scene, planet: PlanetData) {
        this.scene = scene;
        this.planet = planet;
    }

    public create(onClick: (planet: PlanetData) => void): void {
        const initialVisual = '\ud83c\udf11'; // Always moon emoji, tint provides variation

        const visualObject = this.scene.add.text(this.planet.x, this.planet.y, initialVisual, {
            fontSize: '48px',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.52, 0.40);

        // Overlay for cross-fading
        const overlay = this.scene.add.text(this.planet.x, this.planet.y, initialVisual, {
            fontSize: '48px',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.52, 0.40);
        overlay.setAlpha(0);
        this.planet.overlayGameObject = overlay;
        this.planet.usingOverlay = false;

        this.applyVisualProperties(visualObject, overlay);

        visualObject.setInteractive({ useHandCursor: true }).on('pointerdown', () => onClick(this.planet));
        overlay.setInteractive({ useHandCursor: true }).on('pointerdown', () => onClick(this.planet));

        this.planet.gameObject = visualObject;

        // Assign incremental depths to effects to respect array order
        if (this.planet.effects) {
            this.planet.effects.forEach((effect, index) => {
                // Base depth for effects starts at 2 (Planet is at 1)
                // We increment by 2 to leave room for internal layering (e.g. front/back)
                const baseDepth = 2 + (index * 2);
                if (effect.setDepth) {
                    effect.setDepth(baseDepth);
                }
            });
        }

        // Effects are already instantiated. We just need to ensure their visibility is correct initially.
        if (this.planet.hidden ?? true) {
            // Hide all effects if locked
            if (this.planet.effects) {
                this.planet.effects.forEach(e => e.setVisible(false));
            }
        }

        // Adjust planet depth to be between rings
        // Back Emitter: 0
        // Planet: 1
        // Front Emitter: 2
        visualObject.setDepth(1);
        overlay.setDepth(1);

        if (this.planet.hidden ?? true) {
            this.addLockedParticleEffect();
        }

        // Start animation loop
        // Adjust speed based on size: Larger = Slower (Higher Delay)
        // Base delay 500ms for scale 1.0
        const isRevealed = !(this.planet.hidden ?? true);
        const scale = (isRevealed && this.planet.visualScale) ? this.planet.visualScale : 0.8;
        const delay = 500 * scale;

        this.scene.time.addEvent({
            delay: delay,
            loop: true,
            callback: () => this.animate()
        });
    }



    private applyTintWithDesaturation(obj: Phaser.GameObjects.Text) {
        // First desaturate to grayscale, then color through matrix
        if (obj.postFX) {
            obj.postFX.clear();
        }

        // Clear any Phaser tint first
        obj.clearTint();

        const colorMatrix = obj.postFX.addColorMatrix();
        // Desaturate to grayscale first
        colorMatrix.saturate(-1);

        // Apply color through matrix multiplication if tint defined, BUT ONLY if unlocked
        const isRevealed = !(this.planet.hidden ?? true);
        if (this.planet.tint && isRevealed) {
            const r = ((this.planet.tint >> 16) & 0xFF) / 255;
            const g = ((this.planet.tint >> 8) & 0xFF) / 255;
            const b = (this.planet.tint & 0xFF) / 255;

            // Create a second color matrix to apply the tint
            const tintMatrix = obj.postFX.addColorMatrix();
            tintMatrix.multiply([
                r, 0, 0, 0, 0,
                0, g, 0, 0, 0,
                0, 0, b, 0, 0,
                0, 0, 0, 1, 0
            ]);
        }
    }

    private applyVisualProperties(obj1: Phaser.GameObjects.Text, obj2: Phaser.GameObjects.Text) {
        // Apply desaturation + tint
        this.applyTintWithDesaturation(obj1);
        this.applyTintWithDesaturation(obj2);

        // Hardcoded angle for moons
        obj1.setAngle(45);
        obj2.setAngle(45);
        if (this.planet.visualScale || (this.planet.hidden ?? true)) {
            const isRevealed = !(this.planet.hidden ?? true);
            const targetScale = (isRevealed && this.planet.visualScale) ? this.planet.visualScale : 0.8;
            obj1.setScale(targetScale);
            obj2.setScale(targetScale);
        }
    }

    public update(time: number, delta: number): void {
        this.planet.effects?.forEach(effect => {
            effect.update?.(time, delta);
        });
    }

    public updateVisibility(): void {
        if (!this.planet.gameObject) return;

        const isRevealed = !(this.planet.hidden ?? true);

        if (isRevealed) {
            if (!this.planet.usingOverlay) {
                this.planet.gameObject.setAlpha(1);
            }
        } else {
            this.planet.gameObject.setAlpha(0.8);
        }

        this.animate();
    }

    public animate(): void {
        this.frameIdx = (this.frameIdx + 1) % this.moonFrames.length;
        this.planet.lightPhase = this.frameIdx;

        let nextFrame = '🌑';
        if (!(this.planet.hidden ?? true)) {
            nextFrame = this.moonFrames[this.frameIdx];
        }

        this.updateVisualFrame(nextFrame);
    }

    private updateVisualFrame(newFrame: string) {
        if (!this.planet.gameObject) return;
        const textObj = this.planet.gameObject as Phaser.GameObjects.Text;
        if (!this.planet.overlayGameObject) {
            textObj.setText(newFrame);
            return;
        }

        const main = textObj;
        const overlay = this.planet.overlayGameObject;
        const targetObj = this.planet.usingOverlay ? main : overlay;
        const sourceObj = this.planet.usingOverlay ? overlay : main;

        // Set target frame and make it fully opaque BEHIND the source
        targetObj.setText(newFrame);
        targetObj.setDepth(0.9); // Behind the source
        sourceObj.setDepth(1);   // Source stays on top during fade

        // IMPORTANT: Keep target invisible initially to prevent flash during postFX application
        targetObj.setAlpha(0);

        // Apply desaturation + tint to target only (source already has it)
        this.applyTintWithDesaturation(targetObj);

        if (this.planet.visualScale) {
            const targetScale = !(this.planet.hidden ?? true) ? this.planet.visualScale : 0.8;
            targetObj.setScale(targetScale);
        }
        targetObj.setAngle(45);

        // Now make target visible AFTER postFX are applied
        targetObj.setAlpha(1);

        this.scene.tweens.killTweensOf(targetObj);
        this.scene.tweens.killTweensOf(sourceObj);

        // Fade out the source to reveal the target underneath
        this.scene.tweens.add({
            targets: sourceObj,
            alpha: 0,
            duration: 400,
            ease: 'Linear'
        });

        this.planet.usingOverlay = !this.planet.usingOverlay;

        // Update visibility of effects based on unlocked state
        const isRevealed = !(this.planet.hidden ?? true);

        this.planet.effects?.forEach(effect => {
            effect.setVisible(isRevealed);
        });
    }

    // Helper for locked particle effect
    protected addLockedParticleEffect() {
        if (this.planet.emitter) return;

        this.planet.emitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: [0xffffff],
            lifespan: 1000,
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0 },
            speed: { min: 10, max: 30 },
            blendMode: 'ADD',
            frequency: 100
        });
        if (this.planet.gameObject) {
            this.planet.emitter.startFollow(this.planet.gameObject, 0, -7);
        }
        this.planet.emitter.setDepth(1);
    }
}

export class PlanetVisuals {
    private scene: Phaser.Scene;
    private visuals: Map<string, PlanetVisual> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public createVisuals(planets: PlanetData[], onClick: (planet: PlanetData) => void) {
        planets.forEach(planet => {
            let visual: PlanetVisual;

            visual = new PlanetVisual(this.scene, planet);

            visual.create(onClick);
            this.visuals.set(planet.id, visual);
        });
    }

    public updateVisibility(planets: PlanetData[]) {
        planets.forEach(planet => {
            const visual = this.visuals.get(planet.id);
            if (visual) {
                visual.updateVisibility();
            }
        });
    }

    public update(time: number, delta: number) {
        this.visuals.forEach(visual => visual.update(time, delta));
    }
}
