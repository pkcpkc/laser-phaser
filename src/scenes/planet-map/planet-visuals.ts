import Phaser from 'phaser';
import type { PlanetData } from './planet-registry';
import { SatelliteEffect } from './effects/satellite-effect';
import { GhostShadeEffect } from './effects/ghost-shade-effect';
import { MiniMoonEffect } from './effects/mini-moon-effect';
import { GlimmeringSnowEffect } from './effects/glimmering-snow-effect';
import { SolidRingEffect } from './effects/solid-ring-effect';
import { GasRingEffect } from './effects/gas-ring-effect';
import { SolarFlareEffect } from './effects/solar-flare-effect';

export class PlanetVisual {
    protected scene: Phaser.Scene;
    protected planet: PlanetData;
    private moonFrames = ['🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔'];
    private frameIdx = 0;
    private occluder?: Phaser.GameObjects.Graphics;
    private ghostShadeEffect?: GhostShadeEffect;
    private glimmeringSnowEffect?: GlimmeringSnowEffect;
    private solarFlareEffect?: SolarFlareEffect;

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        this.scene = scene;
        this.planet = planet;
    }

    public create(onClick: (planet: PlanetData) => void): void {
        const initialVisual = '\ud83c\udf11'; // Always moon emoji, tint provides variation

        // Occluder (Black circle behind moon to block ring)
        // Only needed if we have a ring
        if (this.planet.rings?.color !== undefined) {
            this.occluder = this.scene.add.graphics();
            this.occluder.fillStyle(0x000000, 1);
            // Use larger radius (24) to fully cover moon including transparency
            // Adjusted to 22 to slightly tuck it in and avoid "off" look
            this.occluder.fillCircle(0, 0, 22);
            this.occluder.setPosition(this.planet.x, this.planet.y);
            this.occluder.setDepth(0.5); // Between BackRing (0) and Moon (1)
            // Scale with planet if needed
            if (this.planet.visualScale) {
                this.occluder.setScale(this.planet.visualScale);
            }
        }

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

        // Optional Ring Effect
        if (this.planet.rings?.color !== undefined) {
            if (this.planet.rings.type === 'solid') {
                this.planet.ringEffect = new SolidRingEffect(this.scene, this.planet);
            } else {
                this.planet.ringEffect = new GasRingEffect(this.scene, this.planet);
            }
        }

        // Optional Satellite Effect (Orbiting dots)
        if (this.planet.satellites) {
            this.planet.satelliteEffect = new SatelliteEffect(this.scene, this.planet, {
                tint: this.planet.satellites.tint ?? 0xffffff,
                count: this.planet.satellites.count ?? 8
            });
            // Initially hide if planet is locked
            if (!this.planet.unlocked) {
                this.planet.satelliteEffect.setVisible(false);
            }
        }

        // Optional Mini Moon Effects
        if (this.planet.miniMoons && this.planet.miniMoons.length > 0) {
            this.planet.miniMoonEffects = [];

            this.planet.miniMoons.forEach(config => {
                // Generate random properties as requested
                // "assign the mini moons random small sizes" -> 0.25 to 0.50
                const size = config.size ?? Phaser.Math.FloatBetween(0.20, 0.40);

                // Vary orbit parameters so they don't stack
                const radius = Phaser.Math.FloatBetween(45, 75);
                const speed = Phaser.Math.FloatBetween(0.01, 0.03) * (Math.random() > 0.5 ? 1 : -1);
                const startAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

                // Use config tilt if present, else random moderate tilt
                const tilt = config.tilt ?? Phaser.Math.FloatBetween(-80, 80);

                const effect = new MiniMoonEffect(this.scene, this.planet, {
                    tint: config.tint,
                    size: size,
                    orbitRadius: radius,
                    orbitSpeed: speed,
                    startAngle: startAngle,
                    tilt: tilt
                });

                if (!this.planet.unlocked) {
                    effect.setVisible(false);
                }

                this.planet.miniMoonEffects!.push(effect);
            });
        }

        // Optional Glimmering Snow Effect
        if (this.planet.glimmeringSnow) {
            this.glimmeringSnowEffect = new GlimmeringSnowEffect(this.scene, this.planet);
            this.planet.glimmeringSnowEffect = this.glimmeringSnowEffect;
            if (!this.planet.unlocked) {
                this.glimmeringSnowEffect.setVisible(false);
            }
        }

        // Optional Solar Flare Effect
        if (this.planet.solarFlare) {
            this.solarFlareEffect = new SolarFlareEffect(this.scene, this.planet);
            this.planet.solarFlareEffect = this.solarFlareEffect;
            if (!this.planet.unlocked) {
                this.solarFlareEffect.setVisible(false);
            }
        }

        // Adjust planet depth to be between rings
        // Back Emitter: 0
        // Planet: 1
        // Front Emitter: 2
        visualObject.setDepth(1);
        overlay.setDepth(1);

        if (this.planet.ghostShades) {
            this.ghostShadeEffect = new GhostShadeEffect(this.scene, this.planet);
            // Hide initially if locked
            if (!this.planet.unlocked) {
                this.ghostShadeEffect.setVisible(false);
            }
        }

        if (!this.planet.unlocked) {
            this.addLockedParticleEffect();
        }

        // Start animation loop
        // Adjust speed based on size: Larger = Slower (Higher Delay)
        // Base delay 500ms for scale 1.0
        const isUnlocked = this.planet.unlocked ?? false;
        const scale = (isUnlocked && this.planet.visualScale) ? this.planet.visualScale : 0.8;
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
        const isUnlocked = this.planet.unlocked ?? false;
        if (this.planet.tint && isUnlocked) {
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
        if (this.planet.visualScale || this.planet.unlocked === false) {
            const isUnlocked = this.planet.unlocked ?? false;
            const targetScale = (isUnlocked && this.planet.visualScale) ? this.planet.visualScale : 0.8;
            obj1.setScale(targetScale);
            obj2.setScale(targetScale);
            if (this.occluder) this.occluder.setScale(targetScale);
        }
    }

    public update(_time: number, _delta: number): void {
        // 
    }

    public updateVisibility(): void {
        if (!this.planet.gameObject) return;

        if (this.planet.unlocked) {
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

        let nextFrame = '🌑';
        if (this.planet.unlocked) {
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
        targetObj.setAlpha(1);
        targetObj.setDepth(0.9); // Behind the source
        sourceObj.setDepth(1);   // Source stays on top during fade

        // Apply desaturation + tint to target only (source already has it)
        this.applyTintWithDesaturation(targetObj);

        if (this.planet.visualScale) {
            const targetScale = this.planet.unlocked ? this.planet.visualScale : 0.8;
            targetObj.setScale(targetScale);
        }
        targetObj.setAngle(45);

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
        const unlocked = this.planet.unlocked ?? false;

        // Update ring visibility
        if (this.planet.ringEffect) {
            this.planet.ringEffect.setVisible(unlocked);
        }

        // Update satellite visibility
        if (this.planet.satelliteEffect) {
            this.planet.satelliteEffect.setVisible(unlocked);
        }

        // Update distortion visibility
        // Update ghost shade visibility
        if (this.ghostShadeEffect) {
            this.ghostShadeEffect.setVisible(unlocked);
        }
        // Update mini moon visibility
        if (this.planet.miniMoonEffects) {
            const unlocked = this.planet.unlocked ?? false;
            this.planet.miniMoonEffects.forEach(effect => {
                effect.setVisible(unlocked);
            });
        }

        // Update glimmering snow visibility
        if (this.planet.glimmeringSnowEffect) {
            this.planet.glimmeringSnowEffect.setVisible(unlocked);
        }

        if (this.planet.solarFlareEffect) {
            this.planet.solarFlareEffect.setVisible(unlocked);
        }
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

            // Since we defeatured everything to be moons, we default to PlanetVisual
            // We can still use ID to use RingWorldVisual for fallback or specific cases if needed,
            // but the user instruction implies a replacement with matching moon variants.
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
