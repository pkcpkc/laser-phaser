import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
// BaseEffectConfig removed
import { BaseRingEffect } from './base-ring-effect';

export interface SolidRingConfig {
    type: 'solid-ring';
    color: number;
    angle?: number;    // Tilt angle in degrees (default -20)
    rotation?: boolean; // Enable rotation animation
}

export class SolidRingEffect extends BaseRingEffect {
    public static readonly effectType = 'solid-ring';

    private config: SolidRingConfig;

    private backRing?: Phaser.GameObjects.Graphics;
    private frontRing?: Phaser.GameObjects.Graphics;
    // Containers are now assigned to backElement/frontElement

    constructor(scene: Phaser.Scene, planet: PlanetData, config: SolidRingConfig) {
        super(scene, planet, { angle: config.angle });
        this.config = config;
        this.create();
    }

    // Base update handles container positioning
    public update(time: number, delta: number): void {
        super.update?.(time, delta);
    }

    private create() {
        const baseColor = this.config.color;
        const scale = this.planet.visualScale || 1.0;

        // Broaden the ring significantly
        const innerRadiusX = 30 * scale;
        const outerRadiusX = 55 * scale; // Decreased diameter (was 80)
        const radiusYBase = 6 * scale; // Flatter (was 8)

        // const tiltDeg = this.config.angle ?? -20;
        // const tilt = Phaser.Math.DegToRad(tiltDeg);
        const tilt = this.tilt; // Use base tilt

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
                    if (graphics.active) {
                        graphics.alpha = 0.8 + (Math.sin(tween.totalProgress) * 0.1);
                    }
                }
            });

            return graphics;
        };

        // Create Containers
        const backContainer = this.scene.add.container(this.planet.x, this.planet.y);
        const frontContainer = this.scene.add.container(this.planet.x, this.planet.y);

        backContainer.setDepth(this.baseDepth);
        frontContainer.setDepth(this.baseDepth + 2);

        this.backElement = backContainer;
        this.frontElement = frontContainer;

        // Add Rings to Containers
        this.backRing = createRingBand(false);
        this.frontRing = createRingBand(true);

        backContainer.add(this.backRing);
        frontContainer.add(this.frontRing);

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
                const isRotating = this.config.rotation ?? false;
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
                    alpha: (target: Phaser.GameObjects.Image) => target.getData('baseAlpha'),
                    duration: duration,
                    delay: delay,
                    yoyo: true,
                    repeat: -1
                });
            }
        };

        addSparkles(backContainer, false);
        addSparkles(frontContainer, true);

        // Initial visibility
        if (this.planet.hidden ?? true) {
            this.setVisible(false);
        }

        // Add 2D Rotation if enabled
        if (this.config.rotation) {
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

    // SetVisible and Destroy are handled by BaseRingEffect
}
