import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import type { IFormation } from '../formations/types';
import type { ITactic } from '../tactics/types';

export interface IFormationConstructor {
    new(scene: Phaser.Scene, shipClass: any, collisionConfig: ShipCollisionConfig, config?: any, shipConfigs?: ShipConfig[]): IFormation;
}

export interface ITacticConstructor {
    new(config: any): ITactic;
}

// type ShipConstructor = new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship;

export interface FormationConfig {
    // Tactic configuration
    tacticType?: ITacticConstructor;
    tacticConfig?: any;

    // Formation configuration
    formationType: IFormationConstructor;
    shipClass?: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship;
    shipConfigs?: ShipConfig[]; // Changed from single to array
    config?: any; // Specific config for the formation

    startDelay?: number; // Delay before the first spawn of this formation in ms (relative to the step start)
}

export type LevelStep = FormationConfig[];

export interface LevelConfig {
    name: string;
    formations: LevelStep[];
}

type RunnerState = 'DELAY' | 'RUNNING' | 'FINISHED';

const RUNNER_STATES = {
    DELAY: 'DELAY' as const,         // Waiting for startDelay
    RUNNING: 'RUNNING' as const,       // Formation is active
    FINISHED: 'FINISHED' as const       // Done
};

class TacticRunner {
    private scene: Phaser.Scene;
    private config: FormationConfig;
    private collisionConfig: ShipCollisionConfig;
    private tactic: ITactic | null = null;
    private state: RunnerState;
    private timerEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, config: FormationConfig, collisionConfig: ShipCollisionConfig) {
        this.scene = scene;
        this.config = config;
        this.collisionConfig = collisionConfig;
        this.state = RUNNER_STATES.DELAY;

        const startDelay = config.startDelay || 0;
        if (startDelay > 0) {
            this.timerEvent = this.scene.time.delayedCall(startDelay, () => {
                this.spawn();
            });
        } else {
            // Defer spawn to next update cycle to ensure time consistency
            this.timerEvent = this.scene.time.delayedCall(0, () => {
                this.spawn();
            });
        }
    }

    private spawn() {
        this.state = RUNNER_STATES.RUNNING;

        // Use default tactic if none provided? Or should we always have one?
        // Let's assume tacticType is now required or falls back to something if we want it to work.
        // Actually, let's keep it optional but if it's there, it handles formation.
        if (this.config.tacticType) {
            this.tactic = new this.config.tacticType(this.config.tacticConfig || {});

            this.tactic.initialize(
                this.scene,
                this.config.formationType,
                this.config.config ?? {},
                this.config.shipClass || Ship,
                this.config.shipConfigs || [],
                this.collisionConfig
            );

            this.tactic.spawn();
        } else {
            console.warn('TacticRunner: No tacticType provided. Waves should always have a tactic.');
        }
    }

    public update(time: number, delta: number) {
        if (this.state === RUNNER_STATES.RUNNING && this.tactic) {
            this.tactic.update(time, delta);

            if (this.tactic.isComplete()) {
                this.handleComplete();
            }
        }
    }

    private handleComplete() {
        if (this.tactic) {
            this.tactic.destroy();
            this.tactic = null;
        }
        this.state = RUNNER_STATES.FINISHED;
    }

    public isFinished(): boolean {
        return this.state === RUNNER_STATES.FINISHED;
    }

    public destroy() {
        if (this.timerEvent) {
            this.timerEvent.remove();
        }
        if (this.tactic) {
            this.tactic.destroy();
        }
        this.tactic = null;
    }
}

export class Level {
    private scene: Phaser.Scene;
    private config: LevelConfig;
    private currentStepIndex: number = 0;
    private activeRunners: TacticRunner[] = [];
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
        console.log(`Starting Level: ${this.config.name}`);
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
            const runner = new TacticRunner(this.scene, config, this.collisionConfig);
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
