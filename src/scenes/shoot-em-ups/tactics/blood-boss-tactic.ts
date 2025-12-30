import { BaseTactic } from './base-tactic';
import type { IFormation } from '../formations/types';
import Phaser from 'phaser';

export interface BloodBossTacticConfig {
    fireDuration?: number; // Duration to fire in ms (default 4000)
    screenFractionY?: number; // Upper fraction of screen to move in (default 0.66)
    movementRadiusFraction?: number; // Max distance from current pos as fraction of width (default 0.5)
}

enum BossState {
    MOVING,
    ROTATING,
    ATTACKING
}

export class BloodBossTactic extends BaseTactic {
    private config: BloodBossTacticConfig;

    // State machine
    private state: BossState = BossState.MOVING;
    private stateTimer: number = 0;

    // Movement target
    private targetX: number = 0;
    private targetY: number = 0;
    private startX: number = 0;
    private startY: number = 0;
    private movementDuration: number = 2000; // Time to reach target
    private movementTimer: number = 0;

    constructor(config: BloodBossTacticConfig = {}) {
        super();
        this.config = {
            fireDuration: 4000,
            screenFractionY: 0.66,
            movementRadiusFraction: 0.5,
            ...config
        };
    }

    protected updateFormation(formation: IFormation, _time: number, delta: number): void {
        const enemies = formation.getShips();
        if (enemies.length === 0) return;

        // Assuming single boss in formation for this tactic
        const enemyData = enemies[0];
        if (!enemyData.ship || !enemyData.ship.sprite || !enemyData.ship.sprite.active) return;

        const ship = enemyData.ship;
        const sprite = ship.sprite;
        const scene = sprite.scene;

        switch (this.state) {
            case BossState.MOVING:
                this.updateMoving(ship, delta, scene);
                break;
            case BossState.ROTATING:
                this.updateRotating(ship, delta, scene);
                break;
            case BossState.ATTACKING:
                this.updateAttacking(ship, delta);
                break;
        }
    }

    private updateMoving(ship: any, delta: number, scene: Phaser.Scene) {
        if (this.stateTimer === 0) {
            // Pick new target
            const width = scene.scale.width;
            const height = scene.scale.height;

            const currentX = ship.sprite.x;
            const currentY = ship.sprite.y;

            const maxDist = width * (this.config.movementRadiusFraction || 0.5);
            const maxY = height * (this.config.screenFractionY || 0.66);

            // Random point within radius
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * maxDist;

            let tx = currentX + Math.cos(angle) * dist;
            let ty = currentY + Math.sin(angle) * dist;

            // Clamp to bounds
            const padding = 100;
            tx = Phaser.Math.Clamp(tx, padding, width - padding);
            ty = Phaser.Math.Clamp(ty, padding, maxY); // Only upper part

            this.targetX = tx;
            this.targetY = ty;
            this.startX = currentX;
            this.startY = currentY;

            // Calculate duration based on speed
            const distance = Phaser.Math.Distance.Between(currentX, currentY, tx, ty);
            let speed = ship.maxSpeed || 100; // Fallback if 0

            // Enforce minimum speed for gameplay (physics might still yield low values)
            if (speed < 100) {
                console.log(`BloodBossTactic: Speed ${speed} is too slow. Clamping to 100.`);
                speed = 100;
            }

            console.log(`BloodBossTactic: Distance ${distance}, Speed ${speed}`);
            this.movementDuration = (distance / speed) * 1000;
            console.log(`BloodBossTactic: Movement Duration ${this.movementDuration}`);

            // Set rotation to face movement direction
            const movementAngle = Phaser.Math.Angle.Between(currentX, currentY, tx, ty);
            ship.sprite.setRotation(movementAngle);

            this.movementTimer = 0;
        }

        this.stateTimer += delta;
        this.movementTimer += delta;

        // Move
        const progress = Math.min(this.movementTimer / (this.movementDuration || 1), 1.0);

        // Linear movement (no easing)
        const newX = Phaser.Math.Interpolation.Linear([this.startX, this.targetX], progress);
        const newY = Phaser.Math.Interpolation.Linear([this.startY, this.targetY], progress);

        ship.sprite.setPosition(newX, newY);

        if (progress >= 1.0) {
            this.state = BossState.ROTATING;
            this.stateTimer = 0;
        }
    }

    private updateRotating(ship: any, _delta: number, scene: Phaser.Scene) {
        // Find player
        // Assuming player ship is available via some global or scene query
        // For now, let's assume we look for the nearest ship that is NOT an enemy
        // Or passed via registry/game status.
        // A common pattern is looking at scene.ship if it's the player scene

        let targetX = ship.sprite.x; // Default to self (no rotation)
        let targetY = ship.sprite.y + 1000;

        // Try to find player in scene
        // Checking for 'ship' property on scene (Player ship)
        const playerShip = (scene as any).ship;

        if (playerShip && playerShip.sprite && playerShip.sprite.active) {
            targetX = playerShip.sprite.x;
            targetY = playerShip.sprite.y;
        }

        const desiredAngle = Phaser.Math.Angle.Between(
            ship.sprite.x, ship.sprite.y,
            targetX, targetY
        );

        const currentAngle = ship.sprite.rotation;
        const speed = ship.config.definition.gameplay.rotationSpeed || 0.05;

        // Rotate towards
        const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, desiredAngle, speed);
        ship.sprite.setRotation(newAngle);

        // Check if close enough
        if (Math.abs(Phaser.Math.Angle.Wrap(currentAngle - desiredAngle)) < 0.05) {
            this.state = BossState.ATTACKING;
            this.stateTimer = 0;
        }
    }

    private updateAttacking(ship: any, delta: number) {
        this.stateTimer += delta;

        // Fire!
        ship.fireLasers();

        if (this.stateTimer >= (this.config.fireDuration || 4000)) {
            this.state = BossState.MOVING;
            this.stateTimer = 0;
        }
    }
}
