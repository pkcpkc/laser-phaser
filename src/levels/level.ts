import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../ships/ship';
import type { ShipConfig } from '../ships/types';

export interface IFormation {
    spawn(): void;
    update(time: number, delta: number): void;
    isComplete(): boolean;
    destroy(): void;
}

export interface IFormationConstructor {
    new(scene: Phaser.Scene, shipClass: any, collisionConfig: ShipCollisionConfig, config: any, shipConfig?: ShipConfig): IFormation;
}

export interface FormationConfig {
    formationType: IFormationConstructor; // Constructor for the formation (e.g., SinusFormation)
    shipClass?: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship;
    shipConfig?: ShipConfig;
    config?: any; // Specific config for the formation (e.g., SinusFormationConfig)
    count?: number; // Number of times to repeat this formation
    interval?: number; // Delay between repeats in ms
    startDelay?: number; // Delay before the first spawn of this formation in ms (relative to the step start)
}

export type LevelStep = FormationConfig[];

export interface LevelConfig {
    name: string;
    formations: LevelStep[];
}

enum RunnerState {
    DELAY,         // Waiting for startDelay
    RUNNING,       // Formation is active
    REPEAT_DELAY,  // Waiting for interval before repeating
    FINISHED       // All repeats done
}

class FormationRunner {
    private scene: Phaser.Scene;
    private config: FormationConfig;
    private collisionConfig: ShipCollisionConfig;
    private instance: IFormation | null = null;
    private repeatCount: number = 0;
    private maxRepeats: number;
    private state: RunnerState;
    private timerEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, config: FormationConfig, collisionConfig: ShipCollisionConfig) {
        this.scene = scene;
        this.config = config;
        this.collisionConfig = collisionConfig;
        this.maxRepeats = config.count || 1;
        this.state = RunnerState.DELAY;

        const startDelay = config.startDelay || 0;
        if (startDelay > 0) {
            this.timerEvent = this.scene.time.delayedCall(startDelay, () => {
                this.spawn();
            });
        } else {
            this.spawn();
        }
    }

    private spawn() {
        this.state = RunnerState.RUNNING;
        const shipClass = this.config.shipClass || Ship;
        const shipConfig = this.config.shipConfig;

        console.log(`Spawning formation: ${this.config.formationType.name} with ${shipClass.name}`);
        this.instance = new this.config.formationType(
            this.scene,
            shipClass,
            this.collisionConfig,
            this.config.config,
            shipConfig
        );
        this.instance.spawn();
    }

    public update(time: number, delta: number) {
        if (this.state === RunnerState.RUNNING && this.instance) {
            this.instance.update(time, delta);
            if (this.instance.isComplete()) {
                this.handleComplete();
            }
        }
    }

    private handleComplete() {
        if (this.instance) {
            this.instance.destroy();
            this.instance = null;
        }

        this.repeatCount++;

        if (this.repeatCount < this.maxRepeats) {
            this.state = RunnerState.REPEAT_DELAY;
            const interval = this.config.interval || 0;
            if (interval > 0) {
                this.timerEvent = this.scene.time.delayedCall(interval, () => {
                    this.spawn();
                });
            } else {
                this.spawn();
            }
        } else {
            this.state = RunnerState.FINISHED;
        }
    }

    public isFinished(): boolean {
        return this.state === RunnerState.FINISHED;
    }

    public destroy() {
        if (this.timerEvent) {
            this.timerEvent.remove();
        }
        if (this.instance) {
            this.instance.destroy();
        }
    }
}

export class Level {
    private scene: Phaser.Scene;
    private config: LevelConfig;
    private currentStepIndex: number = 0;
    private activeRunners: FormationRunner[] = [];
    private isLevelComplete: boolean = false;
    private collisionConfig: ShipCollisionConfig;
    private onComplete?: () => void;

    constructor(scene: Phaser.Scene, config: LevelConfig, collisionConfig: ShipCollisionConfig, onComplete?: () => void) {
        this.scene = scene;
        this.config = config;
        this.collisionConfig = collisionConfig;
        this.onComplete = onComplete;
    }

    start() {
        this.spawnNextStep();
    }

    update(time: number, delta: number) {
        if (this.isLevelComplete) return;

        // Update active runners
        for (const runner of this.activeRunners) {
            runner.update(time, delta);
        }

        // Clean up finished runners
        this.activeRunners = this.activeRunners.filter(runner => {
            if (runner.isFinished()) {
                runner.destroy();
                return false;
            }
            return true;
        });

        // If no active runners, spawn next step
        if (this.activeRunners.length === 0 && !this.isLevelComplete) {
            this.spawnNextStep();
        }
    }

    private spawnNextStep() {
        if (this.currentStepIndex >= this.config.formations.length) {
            if (!this.isLevelComplete) {
                this.isLevelComplete = true;
                console.log('Level Complete');
                if (this.onComplete) {
                    this.onComplete();
                }
            }
            return;
        }

        const step = this.config.formations[this.currentStepIndex];
        // const configs = Array.isArray(step) ? step : [step]; // Removed backwards compatibility

        for (const config of step) {
            const runner = new FormationRunner(this.scene, config, this.collisionConfig);
            this.activeRunners.push(runner);
        }

        this.currentStepIndex++;
    }

    destroy() {
        for (const runner of this.activeRunners) {
            runner.destroy();
        }
        this.activeRunners = [];
    }
}
