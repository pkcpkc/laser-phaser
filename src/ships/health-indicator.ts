import Phaser from 'phaser';
import type { ShipCombat } from './ship-combat';
import type { ShipDefinition } from './types';

export class HealthIndicator {
    private graphics: Phaser.GameObjects.Graphics;
    private lastDamageTime: number = -1000;

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly parent: Phaser.Physics.Matter.Image,
        private readonly combat: ShipCombat,
        private readonly definition: ShipDefinition
    ) {
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(100);

        // Register update listener
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
    }

    redraw(): void {
        if (!this.graphics) return;

        const maxHealth = this.definition.gameplay.health;
        const currentHealth = Math.max(0, this.combat.currentHealth);
        const percent = currentHealth / maxHealth;

        this.graphics.clear();

        const radius = (Math.max(this.parent.displayWidth, this.parent.displayHeight) * 0.35);
        const thickness = 5;
        const startAngle = Phaser.Math.DegToRad(-90);
        const endAngle = Phaser.Math.DegToRad(-90 + (360 * percent));

        this.graphics.lineStyle(thickness, 0x8b0000, 0.8);
        this.graphics.beginPath();
        this.graphics.arc(0, 0, radius, startAngle, endAngle, false);
        this.graphics.strokePath();
    }

    destroy(): void {
        if (this.graphics) {
            this.graphics.destroy();
        }
        if (this.scene) {
            this.scene.events.off('update', this.update, this);
        }
    }
}
