import { BaseTactic } from './base-tactic';
import type { IFormation } from '../formations/types';
import type { IPathSegment } from './path-segments/types';
import { CoordinateSegment } from './path-segments/coordinate-segment';
import { PlayerTargetSegment } from './path-segments/player-target-segment';

export type PathPoint =
    | IPathSegment
    | [number, number] // Standard coordinate (width%, height%)
    | { type: 'player', approach: number }; // Target player, approach is 0-1 (percentage of distance)

export interface PathTacticConfig {
    points?: PathPoint[];
    faceMovement?: boolean; // Default true
}

export class PathTactic extends BaseTactic {
    private points: IPathSegment[] = [];
    private config: PathTacticConfig;
    private currentTargetIndex: number = 0;

    // State
    private hasStarted: boolean = false;
    private lastAngle: number = Math.PI / 2;
    private displacementX: number = 0;
    private displacementY: number = 0;

    // The "virtual" position of the formation anchor (leader start position) relative to path
    private currentAnchorX: number = 0;
    private currentAnchorY: number = 0;

    // Stable reference to the initial anchor position for displacement calculation
    private originalAnchorX: number | null = null;
    private originalAnchorY: number | null = null;

    // Cache for resolved target position of the current segment
    private resolvedTarget: { x: number, y: number } | null = null;

    constructor(config: PathTacticConfig = {}) {
        super();
        this.config = config;
        this.points = (config.points || []).map(p => this.ensureSegment(p));
    }

    private ensureSegment(point: PathPoint): IPathSegment {
        if (Array.isArray(point)) {
            return new CoordinateSegment(point[0], point[1]);
        }
        if (typeof point === 'object' && 'type' in point && point.type === 'player') {
            return new PlayerTargetSegment(point.approach);
        }
        return point as IPathSegment;
    }

    private resolveTarget(index: number, scene: Phaser.Scene, time: number, speed: number): { x: number, y: number } | null {
        if (index >= this.points.length) return null;

        const segment = this.points[index];
        return segment.resolve({
            scene,
            currentAnchorX: this.currentAnchorX,
            currentAnchorY: this.currentAnchorY,
            time,
            speed
        });
    }

    /**
     * Calculate formation speed as the minimum maxSpeed across all active ships.
     * This ensures mixed formations travel at the slowest ship's speed.
     */
    private getFormationSpeed(validEnemies: { ship: { maxSpeed: number } }[]): number {
        if (validEnemies.length === 0) return 2;

        let minSpeed = Infinity;
        for (const enemy of validEnemies) {
            const speed = enemy.ship.maxSpeed || 2;
            if (speed < minSpeed) {
                minSpeed = speed;
            }
        }
        return minSpeed === Infinity ? 2 : minSpeed;
    }

    protected updateFormation(formation: IFormation, time: number, delta: number): void {
        const enemies = formation.getShips();
        const scene = this.initData?.scene;

        if (!scene) return;

        // 1. Get valid enemies for reference
        const validEnemies = enemies.filter(e => e.ship && e.ship.sprite);
        if (validEnemies.length === 0) return;

        const leaderData = validEnemies[0];

        // 2. Initialize State
        const rawSpeed = this.getFormationSpeed(validEnemies);
        const speedPxPerSec = rawSpeed * 60;
        const speedPxPerMs = speedPxPerSec / 1000;

        if (!this.hasStarted) {
            this.hasStarted = true;

            // Resolve 1st point (Start Position)
            // It MUST be a coordinate, not a Player target (doesn't make sense to start at Player relative?)
            // Actually, if it is 'player', we spawn relative to player? 
            // "once a point has reached, the next point..." implies we spawn at point 0.
            // Let's assume Point 0 is always coordinate for simplicity, or we treat it as spawn pos.

            if (this.points.length > 0) {
                // We treat Index 0 as the spawn point.
                const startPoint = this.resolveTarget(0, scene, time, speedPxPerMs);
                if (startPoint) {
                    this.currentAnchorX = startPoint.x;
                    this.currentAnchorY = startPoint.y;
                }

                // Set target to Index 1
                this.currentTargetIndex = 1;

                // Resolve Index 1 immediately
                this.resolvedTarget = this.resolveTarget(this.currentTargetIndex, scene, time, speedPxPerMs);

                // If we have a target, calculate angle
                if (this.resolvedTarget) {
                    this.lastAngle = Phaser.Math.Angle.Between(
                        this.currentAnchorX,
                        this.currentAnchorY,
                        this.resolvedTarget.x,
                        this.resolvedTarget.y
                    );
                } else {
                    this.lastAngle = Math.PI / 2;
                }
            } else {
                // No points. defined.
                this.currentAnchorX = (leaderData as any).startX ?? 0;
                this.currentAnchorY = (leaderData as any).startY ?? -50;
                this.lastAngle = Math.PI / 2;
                this.resolvedTarget = null;
            }

            // Capture the original LEADER start position to calculate displacement consistently,
            // regardless of which ship is the current leader.
            this.originalAnchorX = (leaderData as any).startX ?? 0;
            this.originalAnchorY = (leaderData as any).startY ?? 0;
        }

        // 3. Move along path - use minimum speed across all active ships
        const dt = delta / 1000;

        let targetAngle = this.lastAngle;
        let distToMove = speedPxPerSec * dt;

        while (distToMove > 0 && this.resolvedTarget) {
            const dx = this.resolvedTarget.x - this.currentAnchorX;
            const dy = this.resolvedTarget.y - this.currentAnchorY;
            const distToTarget = Math.sqrt(dx * dx + dy * dy);

            if (distToTarget < distToMove) {
                // Reached Target
                this.currentAnchorX = this.resolvedTarget.x;
                this.currentAnchorY = this.resolvedTarget.y;
                distToMove -= distToTarget;

                // Advance Index
                this.currentTargetIndex++;

                // Resolve Next Target (Dynamic resolution happens HERE)
                // This ensures "playerShipPosition considered once only"
                this.resolvedTarget = this.resolveTarget(this.currentTargetIndex, scene, time, speedPxPerMs);

                if (this.resolvedTarget) {
                    // Recalculate target angle for NEXT segment
                    this.lastAngle = Phaser.Math.Angle.Between(
                        this.currentAnchorX,
                        this.currentAnchorY,
                        this.resolvedTarget.x,
                        this.resolvedTarget.y
                    );
                    targetAngle = this.lastAngle;
                }
            } else {
                // Move towards current target
                targetAngle = Math.atan2(dy, dx);
                this.lastAngle = targetAngle;
                // Move
                this.currentAnchorX += Math.cos(targetAngle) * distToMove;
                this.currentAnchorY += Math.sin(targetAngle) * distToMove;
                distToMove = 0; // Consumed all movement
            }
        }

        // If distToMove > 0 but no resolvedTarget -> Keep flying in last direction
        if (distToMove > 0 && !this.resolvedTarget) {
            this.currentAnchorX += Math.cos(this.lastAngle) * distToMove;
            this.currentAnchorY += Math.sin(this.lastAngle) * distToMove;
        }

        // Apply Offset if available from current segment
        let offsetX = 0;
        let offsetY = 0;
        let effectiveAngle = this.lastAngle;
        const currentSegment = this.points[this.currentTargetIndex] || this.points[this.points.length - 1];
        if (currentSegment) {
            const ctx = {
                scene,
                currentAnchorX: this.currentAnchorX,
                currentAnchorY: this.currentAnchorY,
                time,
                speed: speedPxPerMs
            };

            if (currentSegment.getOffset) {
                const offset = currentSegment.getOffset(ctx, this.lastAngle);
                offsetX = offset.x;
                offsetY = offset.y;
            }

            if (currentSegment.getRotation) {
                effectiveAngle = currentSegment.getRotation(ctx, this.lastAngle);
            }
        }

        // Calculate Displacement relative to ORIGINAL Anchor (Consistently)
        // Check if originalAnchorX is set (it should be if hasStarted is true, but TS might complain or runtime edge case)
        const startX = this.originalAnchorX ?? 0;
        const startY = this.originalAnchorY ?? 0;

        this.displacementX = (this.currentAnchorX + offsetX) - startX;
        this.displacementY = (this.currentAnchorY + offsetY) - startY;

        // 4. Apply to enemies
        const sceneWidth = scene.scale.width;
        const sceneHeight = scene.scale.height;
        const buffer = 500;

        for (const enemyData of enemies) {
            if (!enemyData.ship || !enemyData.ship.sprite || !enemyData.ship.sprite.active) continue;
            const enemy = enemyData.ship.sprite;

            // Check Spawn Time
            const elapsed = time - enemyData.spawnTime;
            if (elapsed < 0) {
                enemy.setVisible(false);
                continue;
            }
            enemy.setVisible(true);

            // Fire
            enemyData.ship.fireLasers();

            // Position
            const eStartX = (enemyData as any).startX ?? enemy.x;
            const eStartY = (enemyData as any).startY ?? enemy.y;

            enemy.setPosition(eStartX + this.displacementX, eStartY + this.displacementY);

            // Rotation
            if (this.config.faceMovement !== false) {
                const currentRot = enemy.rotation;
                enemy.setRotation(Phaser.Math.Angle.RotateTo(currentRot, effectiveAngle, 3 * dt));
            }
            enemy.setVelocity(0, 0);

            // Cleanup
            if (enemy.y > sceneHeight + buffer || enemy.y < -buffer ||
                enemy.x < -buffer || enemy.x > sceneWidth + buffer) {
                if (this.hasStarted && elapsed > 1000) {
                    enemyData.ship.destroy();
                }
            }
        }
    }
}
