import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';
import { SatelliteEffect } from './satellite-effect';
import { GhostShadeEffect } from './ghost-shade-effect';
import { MiniMoonEffect } from './mini-moon-effect';
import { GlimmeringSnowEffect } from './glimmering-snow-effect';

export class PlanetVisual {
    protected scene: Phaser.Scene;
    protected planet: PlanetData;
    private moonFrames = ['🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔'];
    private frameIdx = 0;
    private occluder?: Phaser.GameObjects.Graphics;
    private ghostShadeEffect?: GhostShadeEffect;
    private glimmeringSnowEffect?: GlimmeringSnowEffect;

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

        // Optional Ring Effect
        if (this.planet.rings?.color !== undefined) {
            if (this.planet.rings.type === 'solid') {
                this.createSolidRings();
            } else {
                this.createRingEmitters();
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
                // "assign the mini moons random small sizes" -> 0.15 to 0.35
                const size = config.size ?? Phaser.Math.FloatBetween(0.15, 0.35);

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

    private createSolidRings() {
        const baseColor = this.planet.rings?.color ?? (this.planet.tint || 0xffffff);
        const scale = this.planet.visualScale || 1.0;

        // Broaden the ring significantly
        const innerRadiusX = 30 * scale;
        const outerRadiusX = 55 * scale; // Decreased diameter (was 80)
        const radiusYBase = 6 * scale; // Flatter (was 8)

        const tiltDeg = this.planet.rings?.angle ?? -20;
        const tilt = Phaser.Math.DegToRad(tiltDeg);

        const bandCount = 12; // More bands for smoother fill

        const createRingBand = (isFront: boolean) => {
            const graphics = this.scene.add.graphics();

            // Draw multiple concentric lines to form a band with "nuances"
            for (let i = 0; i < bandCount; i++) {
                const t = i / (bandCount - 1);

                // Interpolate radius
                const rX = Phaser.Math.Linear(innerRadiusX, outerRadiusX, t);
                const rY = radiusYBase * (rX / innerRadiusX); // Keep aspect ratio roughly consistent or flat

                // Vary alpha and thickness for texture
                // Edges fade out, center is solid
                const distFromCenter = Math.abs(t - 0.5) * 2; // 0 at center, 1 at edges
                const alpha = 0.9 - (distFromCenter * 0.6);
                const thickness = 3 * scale; // Slightly thinner as ring is smaller

                // Slight color variation?
                // We can't easily vary color per stroke in one batch efficiently without new path,
                // but we can vary alpha. Use tint afterwards for color shifting.

                graphics.lineStyle(thickness, baseColor, alpha);

                const startAngle = isFront ? 0 : Math.PI;
                const endAngle = isFront ? Math.PI : Math.PI * 2;
                const steps = 256; // High resolution for smooth rotation
                const step = (endAngle - startAngle) / steps;

                const points: { x: number, y: number }[] = [];

                for (let j = 0; j <= steps; j++) {
                    const angle = startAngle + (j * step);
                    const ux = rX * Math.cos(angle);
                    const uy = rY * Math.sin(angle);
                    const tx = ux * Math.cos(tilt) - uy * Math.sin(tilt);
                    const ty = ux * Math.sin(tilt) + uy * Math.cos(tilt);
                    points.push({ x: tx, y: ty });
                }

                graphics.beginPath();
                if (points.length > 0) {
                    graphics.moveTo(points[0].x, points[0].y);
                    for (let k = 1; k < points.length; k++) {
                        graphics.lineTo(points[k].x, points[k].y);
                    }
                }
                graphics.strokePath();
            }

            // Position at 0,0 relative to container
            graphics.setPosition(0, 0);

            // Add subtle alpha shimmering tween
            this.scene.tweens.addCounter({
                from: 0,
                to: 100,
                duration: 3000,
                yoyo: true,
                repeat: -1,
                onUpdate: (tween) => {
                    // Subtle alpha pulse
                    graphics.alpha = 0.8 + (Math.sin(tween.totalProgress) * 0.1);
                }
            });

            return graphics;
        };

        // Create Containers
        const backContainer = this.scene.add.container(this.planet.x, this.planet.y);
        const frontContainer = this.scene.add.container(this.planet.x, this.planet.y);

        backContainer.setDepth(0);
        frontContainer.setDepth(2);

        // Add Rings to Containers
        const backRing = createRingBand(false);
        const frontRing = createRingBand(true);

        backContainer.add(backRing);
        frontContainer.add(frontRing);

        // Track for visibility references (store containers as the "ring" visual interface)
        this.planet.backRing = backContainer as any;
        this.planet.frontRing = frontContainer as any;

        // Sparkles mostly in the middle of the band
        const midRadiusX = (innerRadiusX + outerRadiusX) / 2;

        // Helper to add sparkle sprites
        const addSparkles = (container: Phaser.GameObjects.Container, isFront: boolean) => {
            const count = 30; // Number of permanent sparkles per side

            for (let i = 0; i < count; i++) {
                // Random position logic (reused)
                const minAngle = isFront ? 0 : Math.PI;
                const maxAngle = isFront ? Math.PI : Math.PI * 2;
                const angle = Phaser.Math.FloatBetween(minAngle, maxAngle);

                const rJitter = Phaser.Math.FloatBetween(-5 * scale, 5 * scale);
                const rX = midRadiusX + rJitter;
                const rY = radiusYBase * (rX / innerRadiusX);

                // Create a trail of segments to follow "Rotation" (Circular path)
                // "Not follow the ring curve but the ring rotation"
                const isRotating = this.planet.rings?.rotation ?? false;
                const segmentCount = isRotating ? 25 : 1; // No tails if not rotating
                const rotationStep = 0.05; // Radians to rotate back per segment

                const trailSprites: Phaser.GameObjects.Image[] = [];

                // Head position on the ellipse
                const headUX = rX * Math.cos(angle);
                const headUY = rY * Math.sin(angle);
                const headTX = headUX * Math.cos(tilt) - headUY * Math.sin(tilt);
                const headTY = headUX * Math.sin(tilt) + headUY * Math.cos(tilt);

                for (let j = 0; j < segmentCount; j++) {
                    const segIsHead = j === 0;

                    const sprite = this.scene.add.image(0, 0, 'flare-white');
                    sprite.setTint(baseColor);
                    sprite.setBlendMode(Phaser.BlendModes.ADD);

                    // For segments, rotate the HEAD position backwards around (0,0)
                    // This creates a trail that follows the 2D rotation path
                    // angle offset = -j * rotationStep (Opposite to CW rotation)
                    const theta = -j * rotationStep;

                    const segX = headTX * Math.cos(theta) - headTY * Math.sin(theta);
                    const segY = headTX * Math.sin(theta) + headTY * Math.cos(theta);

                    sprite.setPosition(segX, segY);

                    // Rotation matches the circular tangent
                    // Tangent of circle at (x,y) is (-y, x)
                    // Let's use standard atan2(y,x) + PI/2
                    sprite.setRotation(Math.atan2(segY, segX) + (Math.PI / 2));

                    // Scale and Alpha falloff
                    const falloff = 1 - (j / segmentCount);
                    sprite.setScale(
                        (segIsHead ? 0.3 : 0.2) * scale * falloff,
                        (segIsHead ? 0.15 : 0.1) * scale * falloff
                    );

                    sprite.setData('baseAlpha', segIsHead ? 1.0 : 0.5 * falloff);
                    sprite.setAlpha(0);

                    container.add(sprite);
                    trailSprites.push(sprite);
                }

                // Animate the whole trail group together
                const duration = Phaser.Math.Between(1000, 2000);
                const delay = Phaser.Math.Between(0, 2000);

                this.scene.tweens.add({
                    targets: trailSprites,
                    alpha: (target: any) => target.getData('baseAlpha'),
                    duration: duration,
                    delay: delay,
                    yoyo: true,
                    repeat: -1
                });
            }
        };

        addSparkles(backContainer, false);
        addSparkles(frontContainer, true);

        if (!this.planet.unlocked) {
            backContainer.setVisible(false);
            frontContainer.setVisible(false);
        }

        // Add 2D Rotation if enabled
        if (this.planet.rings?.rotation) {
            const duration = 15000; // Slightly faster for fluidity

            this.scene.tweens.add({
                targets: [backContainer, frontContainer],
                rotation: Math.PI * 2, // Use rotation (radians) for smoothness
                duration: duration,
                repeat: -1,
                ease: 'Linear'
            });
        }
    }

    private createRingEmitters() {
        const ringColor = this.planet.rings?.color ?? (this.planet.tint || 0xffffff);
        const scale = this.planet.visualScale || 1.0;

        // 1. Reduce diameter (was 60/16) -> User requested broader: 55 -> Back to 48 but thicker
        const radiusX = 48 * scale;
        const radiusY = 8 * scale; // Reduced from 14 to 8 for flatter look
        const thickness = 8 * scale; // Slightly reduced thickness (was 10)
        const yOffset = 5 * scale;
        const tiltDeg = this.planet.rings?.angle ?? -20;
        const tilt = Phaser.Math.DegToRad(tiltDeg);

        // Use arrow functions that reference this.planet directly for dynamic positioning
        const getCenterX = () => this.planet.x;
        const getCenterY = () => this.planet.y - yOffset;

        const createEmitter = (isFront: boolean) => {
            return this.scene.add.particles(0, 0, 'flare-white', {
                color: [ringColor],
                alpha: { start: 0.5, end: 0 }, // Reduced alpha for higher density
                scale: { start: 0.15 * scale, end: 0 }, // Slightly smaller particles
                lifespan: this.planet.rings?.lifespan || 800, // Configurable lifespan
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
        if (this.planet.ringEmitters) {
            this.planet.ringEmitters.forEach(emitter => {
                emitter.setVisible(unlocked);
                emitter.active = unlocked;
            });
        }

        // Update solid ring visibility
        if (this.planet.backRing) this.planet.backRing.setVisible(unlocked);
        if (this.planet.frontRing) this.planet.frontRing.setVisible(unlocked);

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
