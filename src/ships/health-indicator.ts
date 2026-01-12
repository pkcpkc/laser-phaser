import Phaser from 'phaser';
import type { ShipCombat } from './ship-combat';
import type { ShipDefinition } from './types';

export class HealthIndicator {
    private graphics: Phaser.GameObjects.Graphics;
    private sparkEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
    private lastDamageTime: number = -1000;
    private currentPercent: number = 1;
    private trailPercent: number = 1;

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly parent: Phaser.Physics.Matter.Image,
        private readonly combat: ShipCombat,
        private readonly definition: ShipDefinition
    ) {
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(100);

        this.sparkEmitter = scene.add.particles(0, 0, 'flare-white', {
            color: [0xff6600, 0xff9900, 0xffcc00],
            alpha: { start: 1, end: 0 },
            scale: { start: 0.15, end: 0 },
            lifespan: { min: 150, max: 300 },
            blendMode: 'ADD',
            quantity: 1,
            frequency: -1,
            emitting: false
        });
        this.sparkEmitter.setDepth(101);

        this.scene.events.on('update', this.update, this);
        this.parent.once('destroy', () => this.destroy());
    }

    onDamage(): void {
        this.lastDamageTime = this.scene.time.now;
    }

    update(): void {
        if (!this.graphics || !this.parent.active) return;

        this.graphics.setPosition(this.parent.x, this.parent.y);

        const timeSinceDamage = this.scene.time.now - this.lastDamageTime;
        const targetAlpha = timeSinceDamage < 1000 ? 1 : 0.3;
        this.graphics.setAlpha(targetAlpha);

        const maxHealth = this.definition.gameplay.health;
        const currentHealth = Math.max(0, this.combat.currentHealth);
        const targetPercent = currentHealth / maxHealth;

        const isHealthDecreasing = this.currentPercent > targetPercent;
        if (isHealthDecreasing) {
            this.currentPercent = Math.max(targetPercent, this.currentPercent - 0.02);
        }

        const isTrailVisible = this.trailPercent > this.currentPercent;
        if (isTrailVisible) {
            this.trailPercent = Math.max(this.currentPercent, this.trailPercent - 0.005);
            this.emitSparks();
        }

        this.redraw();
    }

    private emitSparks(): void {
        if (!this.sparkEmitter) return;

        const radius = (Math.max(this.parent.displayWidth, this.parent.displayHeight) * 0.35);
        const sparkAngle = Phaser.Math.DegToRad(-90 + (360 * this.currentPercent));

        const sparkX = this.parent.x + Math.cos(sparkAngle) * radius;
        const sparkY = this.parent.y + Math.sin(sparkAngle) * radius;

        this.sparkEmitter.emitParticleAt(sparkX, sparkY, Phaser.Math.Between(1, 3));
    }

    redraw(): void {
        if (!this.graphics) return;

        this.graphics.clear();

        const radius = (Math.max(this.parent.displayWidth, this.parent.displayHeight) * 0.35);
        const thickness = 5;
        const startAngle = Phaser.Math.DegToRad(-90);

        // Draw burn trail (orange)
        if (this.trailPercent > this.currentPercent) {
            const trailStartAngle = Phaser.Math.DegToRad(-90 + (360 * this.currentPercent));
            const trailEndAngle = Phaser.Math.DegToRad(-90 + (360 * this.trailPercent));
            this.graphics.lineStyle(thickness, 0xff6600, 0.9);
            this.graphics.beginPath();
            this.graphics.arc(0, 0, radius, trailStartAngle, trailEndAngle, false);
            this.graphics.strokePath();
        }

        // Draw health arc (dark red)
        const endAngle = Phaser.Math.DegToRad(-90 + (360 * this.currentPercent));
        this.graphics.lineStyle(thickness, 0x8b0000, 0.8);
        this.graphics.beginPath();
        this.graphics.arc(0, 0, radius, startAngle, endAngle, false);
        this.graphics.strokePath();
    }

    destroy(): void {
        if (this.sparkEmitter) {
            this.sparkEmitter.destroy();
        }
        if (this.graphics) {
            this.graphics.destroy();
        }
        if (this.scene) {
            this.scene.events.off('update', this.update, this);
        }
    }
}
