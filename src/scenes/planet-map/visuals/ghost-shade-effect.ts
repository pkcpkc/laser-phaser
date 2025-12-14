import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';

/**
 * Creates ghost shade effect around a planet.
 * Semi-transparent green shades that drift slowly over the planet surface like atmospheric ghosts.
 */
export class GhostShadeEffect {
    private scene: Phaser.Scene;
    private planet: PlanetData;
    private updateListener: () => void;

    // Tendril emitters
    private tendrils: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    private numTendrils: number = 4;

    // Animation state
    private time: number = 0;

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        this.scene = scene;
        this.planet = planet;

        this.createTendrils();

        this.updateListener = () => this.update();
        this.scene.events.on('update', this.updateListener);
    }

    private createTendrils() {
        if (!this.planet.gameObject) return;

        const planetDepth = this.planet.gameObject.depth || 1;
        const scale = this.planet.visualScale || 1.0;

        // Create emitters for ghostly green shades that hover over the planet
        for (let i = 0; i < this.numTendrils; i++) {
            const angle = (Math.PI * 2 * i) / this.numTendrils;

            const emitter = this.scene.add.particles(0, 0, 'flare-white', {
                color: [0x00cc22, 0x00dd33, 0x00ee44], // Intense neon greens
                colorEase: 'sine.inOut',
                alpha: { start: 0.35, end: 0 }, // Slightly more visible
                scale: { start: 1.2 * scale, end: 0.2 * scale }, // Much larger particles
                lifespan: 6000, // Longer life for drifting effect
                frequency: 800, // Less frequent emission for larger shades
                blendMode: 'ADD', // Glowing blend mode
                emitting: true,
                speed: { min: 3, max: 10 }, // Slow drift
                angle: { min: 0, max: 360 }, // Random directions
                gravityY: 0,
                gravityX: 0,
                emitCallback: (particle: Phaser.GameObjects.Particles.Particle) => {
                    // Store emission info
                    (particle as any).baseAngle = angle;
                    (particle as any).initialTime = this.time;
                }
            });

            emitter.setDepth(planetDepth + 0.8); // Just above the planet
            this.tendrils.push(emitter);
        }
    }

    private update() {
        if (!this.planet.gameObject) return;

        const center = this.planet.gameObject.getCenter();
        const scale = this.planet.visualScale || 1.0;
        this.time += 0.016; // Approximate delta time

        // Update each shade emitter to slowly orbit
        this.tendrils.forEach((emitter, index) => {
            const baseAngle = (Math.PI * 2 * index) / this.numTendrils;

            // Very slowly rotate the emission point
            const rotation = this.time * 0.02 + baseAngle;

            // Keep close to planet surface
            const radius = 22 * scale;

            const emitX = center.x + Math.cos(rotation) * radius;
            const emitY = center.y + Math.sin(rotation) * radius;

            emitter.setPosition(emitX, emitY);
        });
    }

    public setVisible(visible: boolean) {
        this.tendrils.forEach(emitter => {
            emitter.setVisible(visible);
            emitter.emitting = visible;
            if (!visible) {
                emitter.killAll(); // Clear all particles when hidden
            }
        });
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        this.tendrils.forEach(emitter => emitter.destroy());
        this.tendrils = [];
    }
}
