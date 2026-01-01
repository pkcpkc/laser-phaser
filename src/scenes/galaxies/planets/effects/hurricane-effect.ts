import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import type { IPlanetEffect } from '../planet-effect';

export interface HurricaneConfig {
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
    public static readonly effectType = 'hurricane';

    private scene: Phaser.Scene;
    private planet: PlanetData;
    private config: HurricaneConfig;

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
    private readonly PLANET_RADIUS = 23;

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
    }

    public update(_time: number, _delta: number) {
        this.onUpdate();
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
            emitting: !(this.planet.hidden ?? true) // Don't start emitting if hidden
        });
        this.eyeEmitter.setDepth(2.1);

        // Initial visibility based on planet hidden state
        if (this.planet.hidden ?? true) {
            this.setVisible(false);
        }
    }

    // Reusable objects to reduce GC
    private readonly tempQ = new Phaser.Math.Quaternion();
    private readonly tempVec3 = new Phaser.Math.Vector3();
    private readonly globalUp = new Phaser.Math.Vector3(0, 1, 0);
    private readonly normal = new Phaser.Math.Vector3();
    private readonly right = new Phaser.Math.Vector3();
    private readonly forward = new Phaser.Math.Vector3();


    private isVisible: boolean = true;

    private onUpdate() {
        // Skip update entirely if planet is hidden or effect is manually hidden
        if ((this.planet.hidden ?? true) || !this.isVisible) {
            return;
        }

        if (!this.planet.gameObject || !this.armEmitter || !this.eyewallEmitter) return; // Emitters might be null if texture was missing

        const scale = this.planet.visualScale || 1.0;
        const planetRadius = this.PLANET_RADIUS * scale;

        const rotSpeed = (0.025 + this.speedVariance) / scale;

        // Rotation
        this.tempQ.setAxisAngle(this.orbitAxis, rotSpeed);
        this.currentPos.transformQuat(this.tempQ).normalize();

        // --- SPHERICAL BASIS CALCULATION ---
        const nx = this.currentPos.x;
        const ny = this.currentPos.y;
        const nz = this.currentPos.z;

        // Basis Vectors
        this.normal.set(nx, ny, nz);

        if (Math.abs(this.normal.dot(this.globalUp)) > 0.99) {
            this.right.crossVectors(this.tempVec3.set(1, 0, 0), this.normal).normalize();
        } else {
            this.right.crossVectors(this.globalUp, this.normal).normalize();
        }

        this.forward.crossVectors(this.normal, this.right).normalize();

        const zDepth = nz;

        // Stricter visibility culling
        const fadeStart = 0.3;
        const fadeEnd = -0.1; // Fully transparent slightly behind horizon
        let globalAlpha = 1.0;

        if (zDepth < fadeStart) {
            const t = (zDepth - fadeEnd) / (fadeStart - fadeEnd);
            globalAlpha = Math.max(0, Math.min(1, t));
        }

        // Apply global alpha
        if (globalAlpha <= 0.01) {
            // Optimization: Hide if fully transparent
            this.armEmitter.setVisible(false);
            this.eyewallEmitter.setVisible(false);
            if (this.eyeEmitter) this.eyeEmitter.setVisible(false);
            return;
        } else {
            this.armEmitter.setVisible(true);
            this.eyewallEmitter.setVisible(true);
            if (this.eyeEmitter) this.eyeEmitter.setVisible(true);
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

                const px = rlx * this.right.x + rly * this.forward.x + localZ * this.normal.x;
                const py = rlx * this.right.y + rly * this.forward.y + localZ * this.normal.y;
                const pz = rlx * this.right.z + rly * this.forward.z + localZ * this.normal.z;

                // Strict positive Z only
                if (pz > 0) {
                    try {
                        // Emitter is at 0,0, so we pass World Coordinates
                        emitter.emitParticle(1, this.planet.x + px, this.planet.y + py);
                    } catch (e) {
                        // console.error('Hurricane emit error:', e);
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

        this.spiralAngle += 0.04;
    }

    public setVisible(visible: boolean) {
        this.isVisible = visible;
        this.armEmitter?.setVisible(visible);
        this.eyewallEmitter?.setVisible(visible);
        if (this.eyeEmitter) {
            this.eyeEmitter.setVisible(visible);
            if (visible && this.eyeEmitter.start) this.eyeEmitter.start();
            else if (!visible && this.eyeEmitter.stop) this.eyeEmitter.stop();
        }
    }

    public clearParticles() {
        this.armEmitter?.killAll();
        this.eyewallEmitter?.killAll();
        this.eyeEmitter?.killAll();
    }

    private baseDepth: number = 0;

    public setDepth(depth: number) {
        this.baseDepth = depth;
        // Planet is at base + 1. Hurricane must be above.
        const effectiveDepth = depth + 1.1;
        this.armEmitter?.setDepth(effectiveDepth);
        this.eyewallEmitter?.setDepth(effectiveDepth);
        this.eyeEmitter?.setDepth(effectiveDepth + 0.1);
    }

    public getDepth(): number {
        return this.baseDepth;
    }

    public getVisualElements(): Phaser.GameObjects.GameObject[] {
        const elements: Phaser.GameObjects.GameObject[] = [];
        if (this.armEmitter) elements.push(this.armEmitter);
        if (this.eyewallEmitter) elements.push(this.eyewallEmitter);
        if (this.eyeEmitter) elements.push(this.eyeEmitter);
        return elements;
    }

    public destroy() {
        this.armEmitter?.destroy();
        this.eyewallEmitter?.destroy();
        this.eyeEmitter?.destroy();
    }
}
