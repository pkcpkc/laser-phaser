import { BaseTactic } from './base-tactic';
import type { IFormation } from '../formations/types';

export interface SinusTacticConfig {
    amplitude: number;
    frequency: number;
    verticalSpeed?: number;
}

const FRAME_DURATION_MS = 16.66;
const DEFAULT_SPEED = 2; // Default vertical speed if not defined in ship config or tactic

export class SinusTactic extends BaseTactic {
    private config: SinusTacticConfig;

    constructor(config: SinusTacticConfig) {
        super();
        this.config = config;
    }

    protected updateFormation(formation: IFormation, time: number, _delta: number): void {
        const enemies = formation.getShips();

        for (const enemyData of enemies) {
            // Safety check
            if (!enemyData.ship || !enemyData.ship.sprite || !enemyData.ship.sprite.active) {
                continue;
            }

            const enemy = enemyData.ship.sprite;
            // Use spawnTime from enemyData to ensure deterministic movement relative to spawn
            // We assume enemyData has spawnTime and startX/startY properties if it was spawned by a formation 
            // that supports this, or we might need to add it to BaseEnemyData if it's universal.
            // For now, let's assume the Formation provides necessary data or we calculate delta.

            // Actually, Tactic movement is often absolute time based or relative to spawn.
            // Let's use time-based movement similar to SinusFormation.

            const elapsed = time - enemyData.spawnTime;
            if (elapsed < 0) continue;

            const speed = this.config.verticalSpeed ?? (enemyData.ship.config.definition.gameplay.speed || DEFAULT_SPEED);

            // We need the original start X. BaseEnemyData doesn't strictly have it but Formations usually store it.
            // Let's check if we can cast or access it.
            // Since we are refactoring, we should ensure Formations expose what's needed.
            // But to avoid complex casting, we can also store state in the Tactic if needed, 
            // OR we rely on the Formation to provide a generic "MovementState" object on the ship/enemyData.

            // For now, let's assume enemyData has 'startX' and 'verticalOffset' as generic props or attached data.
            // Check SinusFormation: it has startX. BaseFormation does not.
            // We should extend BaseEnemyData or let Formation handle the "Get initial state" part.
            // But Tactic drives movement.

            // Let's try to read from the enemy sprite data if possible, as a bridge.
            const startX = (enemyData as any).startX ?? enemy.x; // Fallback?
            const verticalOffset = (enemyData as any).verticalOffset ?? 0;
            const spawnY = (enemyData as any).startY ?? -50;

            // X movement: Sinus
            // We might need a timeOffset too for the wave effect if it's per-ship
            const timeOffset = (enemyData as any).timeOffset ?? 0;

            const phase = time * this.config.frequency + timeOffset;
            const newX = startX + Math.sin(phase) * this.config.amplitude;

            // Y movement: Linear
            const newY = spawnY + verticalOffset + (speed * (elapsed / FRAME_DURATION_MS));

            enemy.setPosition(newX, newY);
            enemy.setVelocity(0, 0);

            // Rotation
            const vx = this.config.amplitude * this.config.frequency * Math.cos(phase) * FRAME_DURATION_MS;
            const vy = speed;
            enemy.setRotation(Math.atan2(vy, vx));

            // Check bounds (using scene from sprite)
            const scene = enemy.scene;
            const height = scene.scale.height;
            const buffer = 100;

            if (enemy.y > height + buffer) {
                enemyData.ship.destroy();
            }
        }
    }
}
