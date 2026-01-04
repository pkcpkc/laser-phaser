import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import type { IPlanetEffect } from '../planet-effect';
import { TimeUtils } from '../../../../utils/time-utils';

export interface SolarFlareConfig {
    type: 'solar-flare';
    color?: number;     // Particle color
    frequency?: number; // Eruption frequency
    speed?: number;     // Eruption speed
}

class SolarFlare {
    public isActive: boolean = true;
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    private timer: Phaser.Time.TimerEvent;
    private angleDeg: number;
    private startTime: number;
    private duration: number;

    constructor(scene: Phaser.Scene, container: Phaser.GameObjects.Container, startX: number, startY: number, angleDeg: number) {
        this.scene = scene;
        this.container = container;
        this.angleDeg = angleDeg;
        this.startTime = scene.time.now;

        // Duration 0.3-1.5 seconds
        this.duration = Phaser.Math.Between(1000, 2000);

        // Core Plasma - The "base" of the fire, hot and bright
        const coreEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            x: startX,
            y: startY,
            color: [0xffaa00, 0xff4400, 0xaa0000], // Orange -> Red -> Dark
            alpha: { start: 1, end: 0, ease: 'Expo.easeIn' },
            scale: { start: 0.3, end: 0.1 }, // Reduced size (was 0.5->0.2)
            speed: { min: 10, max: 40 }, // Slower (was 20-60)
            angle: { min: angleDeg - 25, max: angleDeg + 25 },
            lifespan: { min: 500, max: 1200 },
            blendMode: 'ADD',
            quantity: 3,
            frequency: 10,
            emitting: true,
            rotate: { min: -180, max: 180 }
        });
        this.emitters.push(coreEmitter);
        this.container.add(coreEmitter);

        // Sparks - High speed, shooting far out (Keep these somewhat active for contrast)
        const sparkEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            x: startX,
            y: startY,
            color: [0xffffff, 0xffff00], // Super bright
            alpha: { start: 1, end: 0 },
            scale: { start: 0.1, end: 0 }, // Slightly smaller
            speed: { min: 100, max: 250 }, // Slightly slower
            angle: { min: angleDeg - 45, max: angleDeg + 45 },
            lifespan: { min: 400, max: 800 },
            blendMode: 'ADD',
            quantity: 1,
            frequency: 30,
            emitting: true,
            rotate: { min: 0, max: 360 }
        });
        this.emitters.push(sparkEmitter);
        this.container.add(sparkEmitter);

        // Prominence Stream - The "tongues" licking upwards
        const streamEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            x: startX,
            y: startY,
            color: [0xff6600, 0x990000, 0x330000], // Orange -> Deep Red -> Dark
            alpha: { start: 0.7, end: 0, ease: 'Cubic.easeOut' },
            scale: { start: 0.4, end: 0.1 }, // Reduced size (was 0.7->0.1)
            speed: { min: 50, max: 120 }, // Slower (was 80-180)
            angle: { min: angleDeg - 15, max: angleDeg + 15 },
            lifespan: { min: 500, max: 1000 },
            blendMode: 'ADD',
            quantity: 2,
            frequency: 12,
            emitting: true
        });
        this.emitters.push(streamEmitter);
        this.container.add(streamEmitter);

        // Update loop for this flare
        this.timer = this.scene.time.addEvent({
            delay: 30,
            callback: () => this.update(),
            loop: true
        });
    }

    private update() {
        if (!this.isActive) return;

        const elapsed = this.scene.time.now - this.startTime;
        if (elapsed > this.duration) {
            this.stop();
            return;
        }

        // Flame-like turbulence: Faster, more chaotic jitter
        const t = elapsed * 0.005;
        const waveBase = Math.sin(t) * 30; // Slower base sway
        const waveJitter = (Math.random() - 0.5) * 40; // Chaotic flicker
        const currentAngle = this.angleDeg + waveBase + waveJitter;

        // Update Prominence Stream angle to snake around
        this.emitters[1].setConfig({
            angle: { min: currentAngle - 15, max: currentAngle + 15 }
        });
    }

    private stop() {
        this.isActive = false;
        this.emitters.forEach(e => e.stop());
        this.timer.remove();

        // Destroy emitter after particles die
        TimeUtils.delayedCall(this.scene, 2500, () => {
            this.emitters.forEach(e => e.destroy());
            this.emitters = [];
        });
    }

    public destroy() {
        this.isActive = false;
        if (this.timer) this.timer.remove();
        this.emitters.forEach(e => e.destroy());
        this.emitters = [];
    }
    public get remainingTime(): number {
        return this.duration - (this.scene.time.now - this.startTime);
    }

    public setDepth(depth: number) {
        this.emitters.forEach(e => e.setDepth(depth));
    }
    public getVisualElements(): Phaser.GameObjects.GameObject[] {
        return this.emitters;
    }
}

export class SolarFlareEffect implements IPlanetEffect {
    public static readonly effectType = 'solar-flare';

    private scene: Phaser.Scene;
    private planet: PlanetData;
    private config: SolarFlareConfig;
    private flares: SolarFlare[] = [];
    private isVisible: boolean = true;
    private updateEvent?: Phaser.Time.TimerEvent;
    private container!: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, planet: PlanetData, config: SolarFlareConfig) {
        this.scene = scene;
        this.planet = planet;
        this.config = config;

        // Create a container to hold all flares
        this.container = this.scene.add.container(this.planet.x, this.planet.y);

        this.create();

        // Initial visibility based on planet hidden state
        if (this.planet.hidden ?? true) {
            this.setVisible(false);
        }
    }

    private baseDepth: number = 0;

    public setDepth(depth: number) {
        this.baseDepth = depth;
        // Planet is usually baseDepth + 1. 
        // We want flares ON TOP of planet.
        const flareDepth = 1.1; // Relative to container or baseDepth + 1.1

        if (this.container) {
            this.container.setDepth(depth + 1.1);
        }

        // Update children (flares) relative depth if they are not in a container,
        // but since we have a container we set the container depth.
        this.flares.forEach(f => f.setDepth(flareDepth));
    }

    public getDepth(): number {
        return this.baseDepth;
    }

    public getVisualElements(): Phaser.GameObjects.GameObject[] {
        // Return the main container
        return [this.container];
    }

    private create() {
        // Check for new flares periodically
        this.updateEvent = this.scene.time.addEvent({
            delay: 100, // Check more frequently for smooth overlap
            callback: () => this.checkEruption(),
            loop: true
        });
    }

    private checkEruption() {
        // Skip if planet is hidden
        if (this.planet.hidden ?? true) {
            return;
        }

        if (!this.isVisible || !this.planet.gameObject) return;

        const freq = this.config.frequency ?? 2000;

        // Cap at 6 flares, but cleanup first
        this.flares = this.flares.filter(f => f.isActive);
        if (this.flares.length >= 6) return;

        // Boost chance if empty
        const baseChance = 100 / freq;
        const emptinessBoost = (6 - this.flares.length) * 0.05;

        const shouldSpawn = Math.random() < (baseChance + emptinessBoost);
        const isLonely = this.flares.length === 0;

        if (shouldSpawn || isLonely) {
            this.spawnFlare();
        }

        // Cleanup inactive flares from list
        this.flares = this.flares.filter(f => f.isActive);
    }

    private spawnFlare() {
        if (!this.planet.gameObject) return;

        const angleDeg = Phaser.Math.Between(0, 360);
        const angleRad = Phaser.Math.DegToRad(angleDeg);

        const scale = this.planet.visualScale ?? 1;
        const radius = 1.1 * scale;

        const localX = Math.cos(angleRad) * radius;
        const localY = Math.sin(angleRad) * radius;

        // Pass container instead of scene for adding emitters?
        // SolarFlare constructor expects Scene.
        // We can pass container as well.
        const flare = new SolarFlare(this.scene, this.container, localX, localY, angleDeg);

        // Set depth (relative to container 0)
        // Planet in overlay is depth 1. So 1.1 is good.
        // If not in overlay, container base depth handles global Z.
        flare.setDepth(1.1);

        this.flares.push(flare);
    }

    public update(_time: number, _delta: number) {
        if (!this.isVisible || !this.container) return;

        // Sync container with planet position (especially for intro transition)
        this.container.setPosition(this.planet.x, this.planet.y);
    }

    public setVisible(visible: boolean) {
        this.isVisible = visible;
        this.container.setVisible(visible); // Handle container
        if (!visible) {
            this.flares.forEach(f => f.destroy());
            this.flares = [];
        }
    }

    public destroy() {
        if (this.updateEvent) this.updateEvent.remove();
        this.flares.forEach(f => f.destroy());
        this.flares = [];
        this.container.destroy();
    }
}
