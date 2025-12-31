import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import type { IFormation } from '../formations/types';
import type { ITactic } from '../tactics/types';

export interface IFormationConstructor {
    new(scene: Phaser.Scene, shipClass: ShipConstructor, collisionConfig: ShipCollisionConfig, config?: Record<string, unknown>, shipConfigs?: ShipConfig[]): IFormation;
}

export interface ITacticConstructor {
    new(config: any): ITactic;
}

type ShipConstructor = new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship;

export interface FormationConfig {
    // Tactic configuration
    tacticType?: ITacticConstructor;
    tacticConfig?: any;

    // Formation configuration
    formationType: IFormationConstructor;
    shipClass?: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship;
    shipConfigs?: ShipConfig[]; // Changed from single to array
    config?: Record<string, unknown>; // Specific config for the formation

    count?: number;
    interval?: number; // Delay between repeats in ms
    startDelay?: number; // Delay before the first spawn of this formation in ms (relative to the step start)
}

export type LevelStep = FormationConfig[];

export interface LevelConfig {
    name: string;
    formations: LevelStep[];
}

type RunnerState = 'DELAY' | 'RUNNING' | 'REPEAT_DELAY' | 'FINISHED';

const RUNNER_STATES = {
    DELAY: 'DELAY' as const,         // Waiting for startDelay
    RUNNING: 'RUNNING' as const,       // Formation is active
    REPEAT_DELAY: 'REPEAT_DELAY' as const,  // Waiting for interval before repeating
    FINISHED: 'FINISHED' as const       // All repeats done
};

class FormationRunner {
    private scene: Phaser.Scene;
    private config: FormationConfig;
    private collisionConfig: ShipCollisionConfig;
    private instance: IFormation | null = null;
    private tactic: ITactic | null = null;
    private repeatCount: number = 0;
    private maxRepeats: number;
    private state: RunnerState;
    private timerEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, config: FormationConfig, collisionConfig: ShipCollisionConfig) {
        this.scene = scene;
        this.config = config;
        this.collisionConfig = collisionConfig;
        this.maxRepeats = config.count || 1;
        this.state = RUNNER_STATES.DELAY;

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
        this.state = RUNNER_STATES.RUNNING;
        const shipClass = this.config.shipClass || Ship;
        const shipConfigs = this.config.shipConfigs;



        // Instantiate Tactic first if present
        if (this.config.tacticType) {
            this.tactic = new this.config.tacticType(this.config.tacticConfig || {});
        }

        // Instantiate Formation
        this.instance = new this.config.formationType(
            this.scene,
            shipClass,
            this.collisionConfig,
            this.config.config ?? {},
            shipConfigs
        );
        this.instance.spawn();

        // Assign Formation to Tactic
        if (this.tactic && this.instance) {
            this.tactic.addFormation(this.instance);
        }
    }

    public update(time: number, delta: number) {
        if (this.state === RUNNER_STATES.RUNNING && this.instance) {
            // If we have a tactic, IT updates the formation movement
            if (this.tactic) {
                this.tactic.update(time, delta);
            }

            // Formation also needs update (for shooting, animations, self-cleanup)
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
        // Tactic persists? usually one tactic per runner instance.
        // If we replay, we create new instances?
        // Let's destroy tactic too just in case it holds state, though BaseTactic is simple.
        this.tactic = null;

        this.repeatCount++;

        if (this.repeatCount < this.maxRepeats) {
            this.state = RUNNER_STATES.REPEAT_DELAY;
            const interval = this.config.interval || 0;
            if (interval > 0) {
                this.timerEvent = this.scene.time.delayedCall(interval, () => {
                    this.spawn();
                });
            } else {
                this.spawn();
            }
        } else {
            this.state = RUNNER_STATES.FINISHED;
        }
    }

    public isFinished(): boolean {
        return this.state === RUNNER_STATES.FINISHED;
    }

    public destroy() {
        if (this.timerEvent) {
            this.timerEvent.remove();
        }
        if (this.instance) {
            this.instance.destroy();
        }
        this.tactic = null;
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



        const formattedSummary = step.map(c => {
            const shipName = c.shipConfigs?.[0]?.definition?.id || c.shipClass?.name || 'Unknown Ship';
            const tacticName = c.tacticType?.name;
            return tacticName ? `${tacticName} (${shipName})` : shipName;
        }).join(', ');

        console.log(`Starting Wave ${this.currentStepIndex + 1}: ${formattedSummary}`);

        this.currentStepIndex++;
    }

    destroy() {
        for (const runner of this.activeRunners) {
            runner.destroy();
        }
        this.activeRunners = [];
    }
}
