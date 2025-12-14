import Phaser from 'phaser';
import { BasePlanetVisual } from './base-planet-visual';
import type { PlanetData } from '../planet-registry';
import { SatelliteEffect } from './satellite-effect';

export class AdjustableMoonVisual extends BasePlanetVisual {
    private moonFrames = ['🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔'];
    private frameIdx = 0;
    private occluder?: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        super(scene, planet);
    }

    public create(onClick: (planet: PlanetData) => void): void {
        const initialVisual = '\ud83c\udf11'; // Always moon emoji, tint provides variation

        // Occluder (Black circle behind moon to block ring)
        // Only needed if we have a ring
        if (this.planet.ringColor !== undefined) {
            this.occluder = this.scene.add.graphics();
            this.occluder.fillStyle(0x000000, 1);
            // Use larger radius (24) to fully cover moon including transparency
            this.occluder.fillCircle(0, 0, 24);
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

        // Optional Ring Effect (Particle based)
        if (this.planet.ringColor !== undefined) {
            this.createRingEmitters();
        }

        // Optional Satellite Effect (Orbiting dots)
        if (this.planet.hasSatellites) {
            this.planet.satelliteEffect = new SatelliteEffect(this.scene, this.planet, {
                tint: this.planet.satelliteTint ?? 0xffffff,
                count: this.planet.satelliteCount ?? 8
            });
            // Initially hide if planet is locked
            if (!this.planet.unlocked) {
                this.planet.satelliteEffect.setVisible(false);
            }
        }

        // Adjust planet depth to be between rings
        // Back Emitter: 0
        // Planet: 1
        // Front Emitter: 2
        visualObject.setDepth(1);
        overlay.setDepth(1);

        if (!this.planet.unlocked) {
            this.addLockedParticleEffect();
        }

        // Start animation loop
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

    private createRingEmitters() {
        const ringColor = this.planet.ringColor ?? (this.planet.tint || 0xffffff);
        const scale = this.planet.visualScale || 1.0;

        // 1. Reduce diameter (was 60/16) -> User requested broader: 55 -> Back to 48 but thicker
        const radiusX = 48 * scale;
        const radiusY = 8 * scale; // Reduced from 14 to 8 for flatter look
        const thickness = 8 * scale; // Slightly reduced thickness (was 10)
        const yOffset = 5 * scale;
        const tilt = Phaser.Math.DegToRad(-20);

        // Use arrow functions that reference this.planet directly for dynamic positioning
        const getCenterX = () => this.planet.x;
        const getCenterY = () => this.planet.y - yOffset;

        const createEmitter = (isFront: boolean) => {
            return this.scene.add.particles(0, 0, 'flare-white', {
                color: [ringColor],
                alpha: { start: 0.5, end: 0 }, // Reduced alpha for higher density
                scale: { start: 0.15 * scale, end: 0 }, // Slightly smaller particles
                lifespan: 800, // Increased life (was 400)
                blendMode: 'ADD',
                frequency: 5, // Much more dense (was 40)
                emitCallback: (particle: Phaser.GameObjects.Particles.Particle) => {
                    // Simulate rotation: Tangential velocity
                    // Vector from center (use dynamic center)
                    const centerX = getCenterX();
                    const centerY = getCenterY();
                    const dx = particle.x - centerX;
                    const dy = particle.y - centerY;

                    // Simple rotation logic: just push them "along" the ellipse roughly
                    // Tangent varies, but for a flat ellipse, mostly horizontal?
                    // Let's do proper tangent:
                    // Angle of position
                    const angle = Math.atan2(dy, dx);
                    // Tangent angle (Clockwise)
                    const tangent = angle + (Math.PI / 2);

                    // Speed
                    const speed = 20 * scale;

                    particle.velocityX = Math.cos(tangent) * speed;
                    particle.velocityY = Math.sin(tangent) * speed;
                },
                emitZone: {
                    source: {
                        getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
                            // Use dynamic center position
                            const centerX = getCenterX();
                            const centerY = getCenterY();

                            // Angle range: Front (0 to PI), Back (PI to 2PI)
                            // Standard circle logic: 0 is Right, PI/2 is Down.
                            // We want Front to be "Lower Half" -> y > 0 -> 0 to PI.
                            const minAngle = isFront ? 0 : Math.PI;
                            const maxAngle = isFront ? Math.PI : Math.PI * 2;
                            const angle = Phaser.Math.FloatBetween(minAngle, maxAngle);

                            // Add thickness
                            const rJitter = Phaser.Math.FloatBetween(-thickness, thickness);
                            const rX = radiusX + rJitter;
                            const rY = radiusY + (rJitter * (radiusY / radiusX));

                            // Unrotated ellipse point
                            const ux = rX * Math.cos(angle);
                            const uy = rY * Math.sin(angle);

                            // Rotate by tilt
                            const tx = ux * Math.cos(tilt) - uy * Math.sin(tilt);
                            const ty = ux * Math.sin(tilt) + uy * Math.cos(tilt);

                            point.x = centerX + tx;
                            point.y = centerY + ty;
                            return point;
                        }
                    },
                    type: 'random'
                }
            });
        };

        const backEmitter = createEmitter(false);
        backEmitter.setDepth(0);

        const frontEmitter = createEmitter(true);
        frontEmitter.setDepth(2);

        this.planet.ringEmitters = [backEmitter, frontEmitter];
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

        // Apply color through matrix multiplication if tint defined
        if (this.planet.tint) {
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
        if (this.planet.visualScale) {
            const targetScale = this.planet.unlocked ? this.planet.visualScale : 0.8;
            obj1.setScale(targetScale);
            obj2.setScale(targetScale);
            if (this.occluder) this.occluder.setScale(targetScale);
        }
    }

    public update(_time: number, _delta: number): void {
        // 
    }

    public updateVisibility(): void {
        super.updateVisibility();
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

        // Update ring visibility
        if (this.planet.ringEmitters) {
            const unlocked = this.planet.unlocked ?? false;
            this.planet.ringEmitters.forEach(emitter => {
                emitter.setVisible(unlocked);
                emitter.active = unlocked;
            });
        }

        // Update satellite visibility
        if (this.planet.satelliteEffect) {
            const unlocked = this.planet.unlocked ?? false;
            this.planet.satelliteEffect.setVisible(unlocked);
        }
    }
}

