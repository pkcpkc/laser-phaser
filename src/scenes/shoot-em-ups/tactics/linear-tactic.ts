import { BaseTactic } from './base-tactic';
import type { IFormation } from '../formations/types';

export interface LinearTacticConfig {
    angle?: number; // Movement angle in radians (default: PI/2 = down)
    targetX?: number; // Optional target X to steer towards
    targetY?: number; // Optional target Y to steer towards
    loopLength?: number; // If set, movement loops after this distance
    faceMovement?: boolean; // If true, ship rotates to face movement direction (default: true)
}

const FRAME_DURATION_MS = 16.66;
const DEFAULT_SPEED = 2;

export class LinearTactic extends BaseTactic {
    private config: LinearTacticConfig;

    constructor(config: LinearTacticConfig = {}) {
        super();
        this.config = config;
    }

    protected updateFormation(formation: IFormation, time: number, _delta: number): void {
        const enemies = formation.getShips();

        for (const enemyData of enemies) {
            if (!enemyData.ship || !enemyData.ship.sprite || !enemyData.ship.sprite.active) {
                continue;
            }

            const enemy = enemyData.ship.sprite;
            const elapsed = time - enemyData.spawnTime;
            if (elapsed < 0) continue;

            // TODO: This uses simple linear projection from current position.
            // Problem: If we just adding velocity each frame, it's fine.
            // If we want deterministic pathing, we need start pos.

            // For Linear, adding velocity is usually enough if we set it once?
            // But we want to control it here.

            const speed = enemyData.ship.maxSpeed || DEFAULT_SPEED;


            if (this.config.targetX !== undefined && this.config.targetY !== undefined) {
                // TODO: Implement steering to target
                // This requires startX/Y to be deterministic or just current pos?
                // If it's "Move to Target", we need to know where we are vs target.
                // But simple Linear Tactic usually implies constant velocity.
                // Let's stick to Angle or Straight Down for now.
                // If target provided, we calculate angle ONCE at spawn? 
                // But Tactic update is called every frame.

                // Let's assume standard "Down" if no angle.
            }

            // Using deterministic position based on time to avoid drift if desired,
            // OR just setting velocity.
            // Setting velocity lets physics handle collisions better?
            // But Formations usually override position.

            // Let's use position set for consistency with SinusTactic.
            // We need start pos. 
            // We can assume enemyData has it.
            const startX = (enemyData as any).startX ?? enemy.x; // Risky if not set
            const startY = (enemyData as any).startY ?? -50;

            let dist = speed * (elapsed / FRAME_DURATION_MS);
            if (this.config.loopLength) {
                dist = dist % this.config.loopLength;
            }

            // Effective angle
            const movementAngle = this.config.angle ?? Math.PI / 2;

            const newX = startX + Math.cos(movementAngle) * dist;
            const newY = startY + Math.sin(movementAngle) * dist;

            enemy.setPosition(newX, newY);

            if (this.config.faceMovement !== false) {
                enemy.setRotation(movementAngle);
            }

            enemy.setVelocity(0, 0);

            // Check bounds
            const scene = enemy.scene;
            const width = scene.scale.width;
            const height = scene.scale.height;
            const buffer = 2000; // Generous buffer for linear movement

            if (enemy.y > height + buffer || enemy.y < -buffer || enemy.x < -buffer || enemy.x > width + buffer) {
                enemyData.ship.destroy();
            }
        }
    }
}
