import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import type { IPlanetEffect } from '../planet-effect';

export interface ColorCircleConfig {
    type: 'color-circle';
    color?: number; // Single color for all waves (with random variation)
    colors?: number[]; // Specific color for each wave (overrides color)
    waveCount?: number; // Number of waves (default: 3)
    speed?: number; // Speed multiplier for wave movement
    waveWidth?: number; // Width of each wave band
}

/**
 * Creates a color circle effect with undulating circular rings that sweep across the planet.
 * 
 * FEATURES:
 * 1. COMPLETE WAVE RINGS: 2-4 full circular waves that wrap around the planet
 * 2. SINE WAVE UNDULATION: Waves have realistic up-and-down ripple patterns
 * 3. SURFACE HUGGING: Wave rings follow the sphere surface closely
 * 4. PERSPECTIVE FADING: Individual ring segments fade when behind planet
 * 5. INDEPENDENT ORBITS: Each wave ring has unique axis and speed
 */
export class ColorCircleEffect implements IPlanetEffect {
    public static readonly effectType = 'color-circle';

    private scene: Phaser.Scene;
    private planet: PlanetData;

    // Wave emitters
    private waveEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

    // Wave state
    private waves: Array<{
        orbitAxis: Phaser.Math.Vector3;
        currentPos: Phaser.Math.Vector3;
        speed: number;
        width: number;
        color: number;
    }> = [];

    private readonly PLANET_RADIUS = 23;

    constructor(scene: Phaser.Scene, planet: PlanetData, config: ColorCircleConfig) {
        this.scene = scene;
        this.planet = planet;

        // Infer wave count from colors array if provided, otherwise use waveCount or default
        const waveCount = config.colors ? config.colors.length : (config.waveCount ?? 3);
        const baseSpeed = config.speed ?? 1.0;
        const baseWidth = config.waveWidth ?? 1.0;
        const baseColor = config.color ?? 0x00FFFF;
        const useCustomColors = config.colors && config.colors.length > 0;

        // Initialize waves with random orbits
        // Use golden ratio and wave index to ensure good distribution
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        for (let i = 0; i < waveCount; i++) {
            // Use golden ratio distribution for better randomness
            // This ensures waves are distributed chaotically rather than aligned
            const axisPhi = (Math.random() + i * goldenRatio) * Math.PI * 2;
            const axisTheta = Math.acos(2 * (Math.random() + i * 0.618033) % 1 - 1);
            const ax = Math.sin(axisTheta) * Math.cos(axisPhi);
            const ay = Math.sin(axisTheta) * Math.sin(axisPhi);
            const az = Math.cos(axisTheta);
            const orbitAxis = new Phaser.Math.Vector3(ax, ay, az).normalize();

            // Random starting position orthogonal to axis
            let tempVec = new Phaser.Math.Vector3(Math.random(), Math.random(), Math.random());
            if (tempVec.length() < 0.1) tempVec = new Phaser.Math.Vector3(1, 0, 0);

            const currentPos = new Phaser.Math.Vector3();
            currentPos.crossVectors(orbitAxis, tempVec).normalize();

            // Vary speed and width for each wave
            const speed = baseSpeed * (0.8 + Math.random() * 0.4);
            const width = baseWidth * (0.7 + Math.random() * 0.6);

            // Use custom color if provided, otherwise use base color with variation
            let color: number;
            if (useCustomColors) {
                // Use the color from the array, cycling if not enough colors provided
                color = config.colors![i % config.colors!.length];
            } else {
                // Slight color variation from base color
                const colorVariation = Math.floor(Math.random() * 0x222222);
                color = baseColor ^ colorVariation;
            }

            this.waves.push({
                orbitAxis,
                currentPos,
                speed,
                width,
                color
            });
        }

        this.createEmitters();
    }

    public update(_time: number, _delta: number) {
        this.onUpdate();
    }

    private createEmitters() {
        const scale = this.planet.visualScale || 1.0;

        if (!this.scene.textures.exists('flare-white')) {
            console.error('ColorCircleEffect: Texture "flare-white" missing! Skipping emitter creation.');
            return;
        }

        // Create one emitter per wave
        for (let i = 0; i < this.waves.length; i++) {
            const wave = this.waves[i];

            const emitter = this.scene.add.particles(0, 0, 'flare-white', {
                lifespan: { min: 300, max: 500 },
                scale: { start: 0.04 * scale, end: 0.06 * scale },
                alpha: { start: 0.9, end: 0 },
                color: [wave.color],
                emitting: false
            });
            emitter.setDepth(2);

            this.waveEmitters.push(emitter);
        }

        // Initial visibility based on planet hidden state
        if (this.planet.hidden ?? true) {
            this.setVisible(false);
        }
    }

    private onUpdate() {
        // Skip update entirely if planet is hidden
        if (this.planet.hidden ?? true) {
            return;
        }

        if (!this.planet.gameObject || this.waveEmitters.length === 0) return;

        const scale = this.planet.visualScale || 1.0;
        const planetRadius = this.PLANET_RADIUS * scale;
        const time = Date.now() * 0.001; // Time in seconds for wave animation

        // Update each wave
        for (let i = 0; i < this.waves.length; i++) {
            const wave = this.waves[i];
            const emitter = this.waveEmitters[i];

            // Rotate wave position around its orbit axis
            const rotSpeed = 0.02 * wave.speed / scale;
            const q = new Phaser.Math.Quaternion();
            q.setAxisAngle(wave.orbitAxis, rotSpeed);
            wave.currentPos.transformQuat(q).normalize();

            // Calculate basis vectors for the wave position
            const nx = wave.currentPos.x;
            const ny = wave.currentPos.y;
            const nz = wave.currentPos.z;

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

            // Create a complete circular wave ring that wraps around the planet
            const ringSegments = Math.floor(60 * wave.width); // Full circle

            for (let seg = 0; seg < ringSegments; seg++) {
                const theta = (seg / ringSegments) * Math.PI * 2; // Full 360 degrees

                // Create wave undulation using sine wave
                const wavePhase = time * 2 + i * 2; // Offset phase per wave
                const waveHeight = Math.sin(theta * 4 + wavePhase) * 2.5 * scale;

                // Calculate ring position with undulation
                const ringRadius = planetRadius + waveHeight;

                // Position on the ring using the wave's coordinate system
                const lx = ringRadius * Math.cos(theta);
                const ly = ringRadius * Math.sin(theta);

                // Transform to world space using wave's basis vectors
                // The ring lies in the plane perpendicular to the wave's travel direction
                const px = lx * right.x + ly * forward.x + 0 * normal.x;
                const py = lx * right.y + ly * forward.y + 0 * normal.y;
                const pz = lx * right.z + ly * forward.z + 0 * normal.z;

                // Calculate depth for this point
                const pointDepth = pz;

                // Calculate visibility fade based on depth
                const fadeStart = 0.2;
                const fadeEnd = -0.2;
                let pointAlpha = 1.0;

                if (pointDepth < fadeStart) {
                    const t = (pointDepth - fadeEnd) / (fadeStart - fadeEnd);
                    pointAlpha = Math.max(0, Math.min(1, t));
                }

                // Only emit if somewhat visible
                if (pointAlpha > 0.05) {
                    // Create multiple particles per segment for thickness
                    const particlesPerSegment = 2;
                    for (let p = 0; p < particlesPerSegment; p++) {
                        const depthOffset = (Math.random() - 0.5) * 1.5 * scale;

                        // Add particles both at surface and slightly offset
                        const finalX = this.planet.x + px + normal.x * depthOffset;
                        const finalY = this.planet.y + py + normal.y * depthOffset;

                        try {
                            emitter.emitParticle(1, finalX, finalY);
                        } catch (e) {
                            // Silently handle emit errors
                        }
                    }
                }
            }

            // Set overall visibility
            const centerDepth = nz;
            if (centerDepth < -0.3) {
                emitter.setVisible(false);
            } else {
                emitter.setVisible(true);
                const fadeStart = 0.3;
                const fadeEnd = -0.1;
                let globalAlpha = 1.0;

                if (centerDepth < fadeStart) {
                    const t = (centerDepth - fadeEnd) / (fadeStart - fadeEnd);
                    globalAlpha = Math.max(0, Math.min(1, t));
                }
                emitter.setAlpha(globalAlpha * 0.7);
            }
        }
    }

    public setVisible(visible: boolean) {
        this.waveEmitters.forEach(emitter => {
            emitter?.setVisible(visible);
            if (visible && emitter?.start) emitter.start();
            else if (!visible && emitter?.stop) emitter.stop();
        });
    }

    private baseDepth: number = 0;

    public setDepth(depth: number) {
        this.baseDepth = depth;
        this.waveEmitters.forEach(emitter => {
            // Planet is at depth + 1. We want waves ON TOP of the planet.
            emitter?.setDepth(depth + 1.1);
        });
    }

    public getDepth(): number {
        return this.baseDepth;
    }

    public destroy() {
        this.waveEmitters.forEach(emitter => {
            emitter?.destroy();
        });
        this.waveEmitters = [];
    }
}
