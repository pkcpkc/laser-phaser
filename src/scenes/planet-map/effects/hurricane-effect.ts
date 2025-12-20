import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';
import type { BaseEffectConfig, IPlanetEffect } from '../planet-effect';

export interface HurricaneConfig extends BaseEffectConfig {
    type: 'hurricane';
    color?: number; // Cloud color
}

/**
 * Creates a hurricane effect for a planet.
 * 
 * FEATURES:
 * 1. LARGE EYE: Wide open center.
 * 2. COMPACT CORE: Short lifespan particles to reduce drag/smear.
 * 3. HIGH DENSITY: Compensated with high emission rate.
 * 4. DISTINCT ARMS: 3 sharp spiral arms.
 * 5. PERSPECTIVE DISTORTION (Bending at horizon).
 * 6. REVERSED ORBIT (Matches rotation).
 * 7. GLOBAL ALPHA FADE (Smooth exit/entry).
 */
export class HurricaneEffect implements IPlanetEffect {
    private scene: Phaser.Scene;
    private planet: PlanetData;
    private config: HurricaneConfig;
    private updateListener: () => void;

    // Emitters
    private armEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private eyewallEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private eyeEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

    // Simulation state
    private spiralAngle: number = 0;

    // Orbit State
    private orbitLongitude: number = 0;
    private fixedLatitude: number = 0;
    private speedVariance: number = 0;
    private sizeScale: number = 1.0;
    private readonly PLANET_RADIUS = 22;

    // Arm properties
    private armLengths: number[] = [];
    private armOffsets: number[] = [];
    private armDensities: number[] = [];

    private readonly MAX_ARMS = 3;
    private readonly MAX_RADIUS = 18;

    private cosTilt: number = 0;
    private sinTilt: number = 0;

    constructor(scene: Phaser.Scene, planet: PlanetData, config: HurricaneConfig) {
        this.scene = scene;
        this.planet = planet;
        this.config = config;

        for (let i = 0; i < this.MAX_ARMS; i++) {
            this.armLengths.push(0.8 + Math.random() * 0.4);
            this.armOffsets.push((Math.random() - 0.5) * 0.2);
            this.armDensities.push(0.7 + Math.random() * 0.3);
        }

        this.orbitLongitude = Math.random() * Math.PI * 2;
        const scale = this.planet.visualScale || 1.0;
        this.fixedLatitude = (Math.random() - 0.5) * 10 * scale;

        // Random tilt angle for each hurricane (0 to 360 degrees)
        const tilt = Math.random() * Math.PI * 2;
        this.cosTilt = Math.cos(tilt);
        this.sinTilt = Math.sin(tilt);
        this.speedVariance = (Math.random() * 0.015) - 0.0075; // +/- variation
        this.sizeScale = 0.5 + Math.random() * 0.7; // 0.5x to 1.2x size

        this.createEmitters();

        this.updateListener = () => this.onUpdate();
        this.scene.events.on('update', this.updateListener);
    }

    private createEmitters() {
        // if (!this.planet.gameObject) return;
        const scale = this.planet.visualScale || 1.0;
        const color = this.config.color ?? 0xffffff;

        this.armEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            lifespan: { min: 400, max: 700 }, // Arm lifespan
            scale: { start: 0.03 * scale * this.sizeScale, end: 0.05 * scale * this.sizeScale },
            alpha: { start: 1, end: 0 },
            color: [color],
            emitting: false,
            blendMode: 'NORMAL',
            speed: { min: 1, max: 2 },
        });
        this.armEmitter.setDepth(2);

        this.eyewallEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            lifespan: { min: 150, max: 250 }, // Eyewall lifespan
            scale: { start: 0.03 * scale * this.sizeScale, end: 0.05 * scale * this.sizeScale },
            alpha: { start: 1, end: 0 },
            color: [color],
            emitting: false,
            blendMode: 'NORMAL',
            speed: { min: 1, max: 2 },
        });
        this.eyewallEmitter.setDepth(2);

        this.eyeEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: [0xffffff],
            alpha: { start: 0.8, end: 0 },
            scale: { start: 0.01 * scale * this.sizeScale, end: 0.01 * scale * this.sizeScale },
            lifespan: 500,
            speed: 0,
            frequency: 100,
            blendMode: 'NORMAL',
            emitting: true
        });
        this.eyeEmitter.setDepth(2.1);
    }

    private onUpdate() {
        if (!this.planet.gameObject || !this.armEmitter || !this.eyewallEmitter) return;

        const scale = this.planet.visualScale || 1.0;

        const rotSpeed = (0.025 + this.speedVariance) / scale;
        this.orbitLongitude -= rotSpeed;

        const sphereX = (this.PLANET_RADIUS * scale) * Math.sin(this.orbitLongitude);
        const sphereY = this.fixedLatitude;
        const zDepth = Math.cos(this.orbitLongitude);

        const fadeStart = 0.3;
        const fadeEnd = -0.3;
        let globalAlpha = 1.0;
        if (zDepth < fadeStart) {
            const t = (zDepth - fadeEnd) / (fadeStart - fadeEnd);
            globalAlpha = Math.max(0, Math.min(1, t));
        }

        this.armEmitter.setAlpha(globalAlpha * 0.6);
        this.eyewallEmitter.setAlpha(globalAlpha * 0.6);
        if (this.eyeEmitter) this.eyeEmitter.setAlpha(globalAlpha * 0.5);

        const compressionX = Math.max(0.1, zDepth);

        const centerRotX = sphereX * this.cosTilt - sphereY * this.sinTilt;
        const centerRotY = sphereX * this.sinTilt + sphereY * this.cosTilt;

        const centerX = this.planet.x + centerRotX;
        const centerY = this.planet.y + centerRotY;

        if (this.eyeEmitter) {
            this.eyeEmitter.setPosition(centerX, centerY);
            if (!this.eyeEmitter.emitting) this.eyeEmitter.start();
        }

        if (globalAlpha > 0.01) {
            // 1. ARMS (Long trails)
            // No need to set lifespan, configured in armEmitter

            const currentArmCount = 3;

            for (let arm = 0; arm < currentArmCount; arm++) {
                const armLength = this.armLengths[arm];
                const armOffset = this.armOffsets[arm];
                const armDensity = this.armDensities[arm];

                const armBaseAngle = (arm / currentArmCount) * Math.PI * 2 + armOffset;
                const pointsPerArm = Math.floor(6 * armDensity) + 4;

                for (let p = 0; p < pointsPerArm; p++) {
                    const t = Math.random() * armLength;
                    const spiralTheta = -this.spiralAngle + armBaseAngle + t * 3.5;
                    const radius = (3.5 * this.sizeScale) + t * this.MAX_RADIUS * scale * this.sizeScale;

                    const noiseR = (Math.random() - 0.5) * 1.5 * scale * this.sizeScale;
                    const flatR = radius + noiseR;
                    const dx = Math.cos(spiralTheta) * flatR;
                    const dy = Math.sin(spiralTheta) * flatR;

                    const squashedDx = dx * compressionX;
                    const squashedDy = dy;
                    const finalDx = squashedDx * this.cosTilt - squashedDy * this.sinTilt;
                    const finalDy = squashedDx * this.sinTilt + squashedDy * this.cosTilt;

                    this.armEmitter.emitParticle(1, centerX + finalDx, centerY + finalDy);
                }
            }

            // 2. EYEWALL (Short Trails, High Density)
            // No need to set lifespan, configured in eyewallEmitter

            // Massively boosted count (was 30) to compensate for 1/3 lifespan
            for (let i = 0; i < 80; i++) {
                const r = (3.0 * this.sizeScale) + Math.random() * 1.5 * scale * this.sizeScale;
                const theta = Math.random() * Math.PI * 2;
                const dx = Math.cos(theta) * r * compressionX;
                const dy = Math.sin(theta) * r;

                const finalDx = dx * this.cosTilt - dy * this.sinTilt;
                const finalDy = dx * this.sinTilt + dy * this.cosTilt;

                if (Math.random() > 0.1) {
                    this.eyewallEmitter.emitParticle(1, centerX + finalDx, centerY + finalDy);
                }
            }
        }

        this.spiralAngle += 0.04;
    }

    public setVisible(visible: boolean) {
        this.armEmitter?.setVisible(visible);
        this.eyewallEmitter?.setVisible(visible);
        if (this.eyeEmitter) {
            this.eyeEmitter.setVisible(visible);
            if (visible) this.eyeEmitter.start();
            else this.eyeEmitter.stop();
        }
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        this.armEmitter?.destroy();
        this.eyewallEmitter?.destroy();
        this.eyeEmitter?.destroy();
    }
}
