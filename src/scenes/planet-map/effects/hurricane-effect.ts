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
    private orbitAxis: Phaser.Math.Vector3;
    private currentPos: Phaser.Math.Vector3;
    private speedVariance: number = 0;
    private sizeScale: number = 1.0;
    private readonly PLANET_RADIUS = 22;

    // Arm properties
    private armLengths: number[] = [];
    private armOffsets: number[] = [];
    private armDensities: number[] = [];

    private readonly MAX_ARMS = 3;
    private readonly MAX_RADIUS = 18;

    private tiltAngle: number = 0;

    constructor(scene: Phaser.Scene, planet: PlanetData, config: HurricaneConfig) {
        this.scene = scene;
        this.planet = planet;
        this.config = config;

        for (let i = 0; i < this.MAX_ARMS; i++) {
            this.armLengths.push(0.8 + Math.random() * 0.4);
            this.armOffsets.push((Math.random() - 0.5) * 0.2);
            this.armDensities.push(0.7 + Math.random() * 0.3);
        }

        // Initialize Random Great Circle Orbit
        // 1. Pick a random axis of rotation
        const axisPhi = Math.random() * Math.PI * 2;
        const axisTheta = Math.random() * Math.PI;
        const ax = Math.sin(axisTheta) * Math.cos(axisPhi);
        const ay = Math.sin(axisTheta) * Math.sin(axisPhi);
        const az = Math.cos(axisTheta);
        this.orbitAxis = new Phaser.Math.Vector3(ax, ay, az).normalize();

        // 2. Pick a random starting position Orthogonal to the axis
        let tempVec = new Phaser.Math.Vector3(Math.random(), Math.random(), Math.random());
        if (tempVec.length() < 0.1) tempVec = new Phaser.Math.Vector3(1, 0, 0);

        this.currentPos = new Phaser.Math.Vector3();
        this.currentPos.crossVectors(this.orbitAxis, tempVec).normalize();

        // Random tilt angle for each hurricane (0 to 360 degrees)
        this.tiltAngle = Math.random() * Math.PI * 2;

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

        if (!this.scene.textures.exists('flare-white')) {
            console.error('HurricaneEffect: Texture "flare-white" missing! Skipping emitter creation.');
            return;
        }

        this.armEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            lifespan: { min: 400, max: 700 }, // Arm lifespan
            scale: { start: 0.03 * scale * this.sizeScale, end: 0.05 * scale * this.sizeScale },
            alpha: { start: 1, end: 0 },
            color: [color],
            emitting: false,
            // stopAfter: 0 
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
        if (!this.planet.gameObject || !this.armEmitter || !this.eyewallEmitter) return; // Emitters might be null if texture was missing

        const scale = this.planet.visualScale || 1.0;
        const planetRadius = this.PLANET_RADIUS * scale;

        const rotSpeed = (0.025 + this.speedVariance) / scale;

        // Rotation
        const q = new Phaser.Math.Quaternion();
        q.setAxisAngle(this.orbitAxis, rotSpeed);
        this.currentPos.transformQuat(q).normalize();

        // --- SPHERICAL BASIS CALCULATION ---
        const nx = this.currentPos.x;
        const ny = this.currentPos.y;
        const nz = this.currentPos.z;

        // Basis Vectors
        const globalUp = new Phaser.Math.Vector3(0, 1, 0);
        const normal = new Phaser.Math.Vector3(nx, ny, nz);
        const right = new Phaser.Math.Vector3();
        const forward = new Phaser.Math.Vector3();

        if (Math.abs(normal.dot(globalUp)) > 0.99) {
            right.crossVectors(new Phaser.Math.Vector3(1, 0, 0), normal).normalize();
        } else {
            right.crossVectors(globalUp, normal).normalize();
        }

        forward.crossVectors(normal, right).normalize();

        const zDepth = nz;

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

        const centerX = this.planet.x + nx * planetRadius;
        const centerY = this.planet.y + ny * planetRadius;

        if (this.eyeEmitter) {
            this.eyeEmitter.setPosition(centerX, centerY);
            if (!this.eyeEmitter.emitting) this.eyeEmitter.start();
        }

        const cTilt = Math.cos(this.tiltAngle);
        const sTilt = Math.sin(this.tiltAngle);

        if (globalAlpha > 0.01) {

            const emitParticleOnSphere = (emitter: Phaser.GameObjects.Particles.ParticleEmitter, rValues: number[], spiralOffset: number) => {
                for (let rVal of rValues) {
                    const r = rVal;
                    const theta = spiralOffset;
                    const psi = r / planetRadius;

                    const localR = planetRadius * Math.sin(psi);
                    const localZ = planetRadius * Math.cos(psi);

                    let lx = localR * Math.cos(theta);
                    let ly = localR * Math.sin(theta);

                    const rlx = lx * cTilt - ly * sTilt;
                    const rly = lx * sTilt + ly * cTilt;

                    const px = rlx * right.x + rly * forward.x + localZ * normal.x;
                    const py = rlx * right.y + rly * forward.y + localZ * normal.y;
                    const pz = rlx * right.z + rly * forward.z + localZ * normal.z;

                    if (pz > -5) {
                        if (pz > 0) {
                            try {
                                emitter.emitParticle(1, this.planet.x + px, this.planet.y + py);
                            } catch (e) {
                                // Prevent spamming errors
                                // if (Math.random() < 0.001) console.error('Hurricane emit error:', e);
                            }
                        }
                    }
                }
            };

            // 1. ARMS
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
                    const finalR = radius + noiseR;

                    emitParticleOnSphere(this.armEmitter, [finalR], spiralTheta);
                }
            }

            // 2. EYEWALL
            for (let i = 0; i < 80; i++) {
                const r = (3.0 * this.sizeScale) + Math.random() * 1.5 * scale * this.sizeScale;
                const theta = Math.random() * Math.PI * 2;
                emitParticleOnSphere(this.eyewallEmitter, [r], theta);
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
