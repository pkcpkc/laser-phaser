import { BaseTactic } from './base-tactic';
import type { IFormation } from '../formations/types';

export interface LinearTacticConfig {
    angle?: number; // Movement angle in radians (default: PI/2 = down)
    targetX?: number; // Optional target X to steer towards
    targetY?: number; // Optional target Y to steer towards
    loopLength?: number; // If set, movement loops after this distance
    faceMovement?: boolean; // If true, ship rotates to face movement direction (default: true)
    fireAndWithdraw?: boolean; // If true, ship will retreat to sides after reaching a certain height
}

const DEFAULT_SPEED = 2;

export class LinearTactic extends BaseTactic {
    private config: LinearTacticConfig;
    private calculatedAngle?: number;
    private withdrawY?: number;
    private withdrawDir?: number; // 1 (Right) or -1 (Left)
    private isWithdrawing: boolean = false;
    private displacementX: number = 0;
    private displacementY: number = 0;
    private currentAngle?: number;

    constructor(config: LinearTacticConfig = {}) {
        super();
        this.config = config;
    }

    initialize(
        scene: Phaser.Scene,
        formationType: any,
        formationConfig: any,
        shipClass: any,
        shipConfigs: any[],
        collisionConfig: any
    ): void {
        super.initialize(scene, formationType, formationConfig, shipClass, shipConfigs, collisionConfig);

        // Auto-calculate angle if start/end width percentages are provided and angle is not manually set
        if (this.config.angle === undefined &&
            formationConfig.startWidthPercentage !== undefined &&
            formationConfig.endWidthPercentage !== undefined) {

            const { width, height } = scene.scale;
            const startX = width * formationConfig.startWidthPercentage;
            const endX = width * formationConfig.endWidthPercentage;

            const dx = endX - startX;
            // Total travel distance Y: Height + TopBuffer (200) + BottomBuffer (200) = Height + 400
            // Actually, per user request "spawnbuffer should be fine", implies we care about visual travel through screen.
            // If they spawn at -200 and fly to Height+200, travel Y is Height + 400.
            // If we only consider "visible" part for the percentage... 
            // Usually "start%" is at spawn Y, "end%" is at exit Y.
            // So we use the full travel logic.
            const spawnY = -200; // Assumption from formation constant
            const exitY = height + 200; // Assumption
            const dy = exitY - spawnY; // = Height + 400

            this.config.angle = Math.atan2(dy, dx);

            // Correction: atan2(y, x) gives angle from X axis (0 is Right, PI/2 is Down).
            // We want (dx, dy) vector.
            // Wait, if dx is positive (left to right), and dy is positive (down),
            // Math.atan2(dy, dx) returns angle close to PI/2 (positive).
            // Example: dx=0, dy=100 -> atan2(100, 0) = PI/2 (Down). Correct.
            // Example: dx=100, dy=100 -> atan2(100, 100) = PI/4 (Diagonal Down-Right). Correct.
        }
    }

    protected updateFormation(formation: IFormation, time: number, _delta: number): void {
        const enemies = formation.getShips();
        const scene = this.initData?.scene;

        if (!scene) return;

        // 1. Check for Active Enemies and Setup
        // Check for ANY enemies (even invalid ones might hold slot, but we filter for existing ships)
        const validEnemies = enemies.filter(e => e.ship && e.ship.sprite);
        if (validEnemies.length === 0) return;

        // Use the first valid enemy to drive formation logic / speed / position checks
        // We prefer one that is active/visible, but failing that, any valid one.
        const leaderData = validEnemies[0];
        const leader = leaderData.ship.sprite;

        // 2. Initialize Formation State/Config ONCE
        // Angle Calculation
        if (this.currentAngle === undefined) {
            // Determine initial angle logic (targeting or config)
            let initialAngle = this.config.angle;

            if (initialAngle === undefined && this.config.targetX === undefined) {
                if (this.calculatedAngle !== undefined) {
                    initialAngle = this.calculatedAngle;
                } else {
                    // Calculate targeting angle ONCE
                    // Need scene reference.
                    if (scene && (scene as any).ship && (scene as any).ship.sprite && (scene as any).ship.sprite.active) {
                        const playerShip = (scene as any).ship.sprite;

                        // Determine formation center
                        let refX = (leaderData as any).startX ?? leader.x;
                        let refY = (leaderData as any).startY ?? -50;

                        const formationConfig = this.initData?.formationConfig;
                        if (formationConfig && formationConfig.startWidthPercentage !== undefined) {
                            refX = scene.scale.width * formationConfig.startWidthPercentage;
                            if (formationConfig.spawnY !== undefined) {
                                refY = formationConfig.spawnY;
                            }
                        }

                        const dx = playerShip.x - refX;
                        const dy = playerShip.y - refY;
                        initialAngle = Math.atan2(dy, dx);
                        this.calculatedAngle = initialAngle;
                    } else {
                        initialAngle = Math.PI / 2;
                        this.calculatedAngle = initialAngle;
                    }
                }
            }

            this.currentAngle = initialAngle ?? Math.PI / 2;
        }

        // Fire and Withdraw Check (Formation Level)
        if (this.config.fireAndWithdraw && !this.isWithdrawing) {
            const sceneHeight = scene.scale.height;

            if (this.withdrawY === undefined) {
                this.withdrawY = (sceneHeight * 0.5) + Math.random() * (sceneHeight / 3);
            }

            // Check leader pos relative to formation start + displacement
            // Or actual leader pos?
            // Actual leader pos is safest if it's updated.
            if (leader.y >= this.withdrawY) {
                this.isWithdrawing = true;

                if (this.withdrawDir === undefined) {
                    const centerX = scene.scale.width / 2;
                    this.withdrawDir = leader.x < centerX ? -1 : 1;
                }
            }
        }

        // 3. Update Formation State (Displacement & Angle)
        const dt = _delta / 1000; // seconds

        // Speed logic correction: 
        // Old logic treated speed as pixels/frame if it relied on (elapsed / 16.66).
        // If maxSpeed was provided (e.g. 100), it moved 100 * frames. That's HUGE. 100px/frame = 6000px/sec.
        // Wait, (elapsed / 16.66) is frames.
        // dist = speed * frames.
        // If speed was 2 (default), it moved 2px/frame -> 120px/sec. Reasonable.
        // If speed was 100 (ship.maxSpeed), it moved 100px/frame -> 6000px/sec. SUPER FAST.
        // MAYBE `ship.maxSpeed` is usually small? Or `elapsed` was seconds?
        // `time` and `elapsed` in Phaser are ms.
        // `elapsed / FRAME_DURATION_MS` = frames.
        // So `speed` was definitely "pixels per frame".

        // My new logic uses `speed * dt` (pixels per second).
        // So I need to convert the source speed (px/frame) to px/sec.
        // Or change my calculation to use px/frame.

        // Let's assume input `maxSpeed` is px/frame (based on old logic usage).
        // So `speedInPxPerSec = speedInPxPerFrame * 60`.
        // Let's retrieve speed and multiply by 60 to match expected velocity in px/sec.

        const rawSpeed = leaderData.ship.maxSpeed || DEFAULT_SPEED;
        const speedPxPerSec = rawSpeed * 60;

        let targetAngle = this.calculatedAngle ?? this.config.angle ?? Math.PI / 2; // Default Approach

        if (this.isWithdrawing) {
            // "Bended" withdrawal: Diagonal Down-Right (PI/4) or Down-Left (3*PI/4)
            // 0 = Right, PI/2 = Down, PI = Left
            targetAngle = (this.withdrawDir === 1) ? (Math.PI / 4) : (Math.PI * 0.75);
        }

        // Smooth Turn used for current heading
        // Turn speed: 3 rad/s
        const turnSpeed = 3 * dt;
        this.currentAngle = Phaser.Math.Angle.RotateTo(this.currentAngle!, targetAngle, turnSpeed);

        // Calculate Delta Movement
        const dx = Math.cos(this.currentAngle!) * speedPxPerSec * dt;
        const dy = Math.sin(this.currentAngle!) * speedPxPerSec * dt;

        this.displacementX += dx;
        this.displacementY += dy;

        // 4. Apply to ALL Enemies
        const sceneWidth = scene.scale.width;
        const sceneHeight = scene.scale.height;
        const buffer = 2000;

        for (const enemyData of enemies) {
            if (!enemyData.ship || !enemyData.ship.sprite || !enemyData.ship.sprite.active) continue;

            const enemy = enemyData.ship.sprite;

            // Check Start Delay?
            const elapsed = time - enemyData.spawnTime;
            // Negative elapsed means shouldn't have spawned? 
            // In typical Tactic, we control position if it's active.
            // If elapsed < 0, maybe hide it? 
            // Existing logic checked `elapsed < 0 continue`.
            if (elapsed < 0) {
                enemy.setVisible(false);
                // Do NOT set active false, as it breaks the activeEnemies check at the top
                continue;
            }
            enemy.setVisible(true);

            // Attempt to fire weapons (cooldowns managed internally)
            enemyData.ship.fireLasers();


            // Calculate Position relative to Start + Displacement
            const startX = (enemyData as any).startX;
            const startY = (enemyData as any).startY;

            if (startX !== undefined && startY !== undefined) {
                enemy.setPosition(startX + this.displacementX, startY + this.displacementY);
            } else {
                // Fallback?
                // If no startX/Y, we can't place it relative to formation logic properly.
                // Just apply delta to current?
                enemy.x += dx;
                enemy.y += dy;
            }

            if (this.config.faceMovement !== false) {
                enemy.setRotation(this.currentAngle!);
            }
            enemy.setVelocity(0, 0);

            // Cleanup Bounds
            if (enemy.y > sceneHeight + buffer || enemy.y < -buffer || enemy.x < -buffer || enemy.x > sceneWidth + buffer) {
                enemyData.ship.destroy();
            }
        }
    }
}
