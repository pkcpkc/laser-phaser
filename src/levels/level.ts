import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../ships/ship';

export interface WaveConfig {
    formationType: any; // Constructor for the wave (e.g., SinusWave)
    shipClass: new (scene: Phaser.Scene, x: number, y: number, collisionConfig: ShipCollisionConfig) => Ship;
    config?: any; // Specific config for the wave (e.g., SinusWaveConfig)
    count?: number; // Number of times to repeat this wave
    interval?: number; // Delay between repeats in ms
}

export interface LevelConfig {
    name: string;
    waves: WaveConfig[];
}

export class Level {
    private scene: Phaser.Scene;
    private config: LevelConfig;
    private currentWaveIndex: number = 0;
    private currentWaveRepeatCount: number = 0;
    private currentWaveInstance: any = null; // The actual wave instance
    private isLevelComplete: boolean = false;
    private collisionConfig: ShipCollisionConfig;

    constructor(scene: Phaser.Scene, config: LevelConfig, collisionConfig: ShipCollisionConfig) {
        this.scene = scene;
        this.config = config;
        this.collisionConfig = collisionConfig;
    }

    start() {
        this.spawnNextWave();
    }

    update(time: number, delta: number) {
        if (this.isLevelComplete) return;

        if (this.currentWaveInstance) {
            this.currentWaveInstance.update(time, delta);
            if (this.currentWaveInstance.isComplete()) {
                this.handleWaveComplete();
            }
        }
    }

    private handleWaveComplete() {
        this.currentWaveInstance.destroy();
        this.currentWaveInstance = null;

        const currentWaveConfig = this.config.waves[this.currentWaveIndex];
        const maxRepeats = currentWaveConfig.count || 1;

        this.currentWaveRepeatCount++;

        if (this.currentWaveRepeatCount < maxRepeats) {
            // Repeat the same wave
            const interval = currentWaveConfig.interval || 0;
            if (interval > 0) {
                this.scene.time.delayedCall(interval, () => {
                    this.spawnWave(currentWaveConfig);
                });
            } else {
                this.spawnWave(currentWaveConfig);
            }
        } else {
            // Move to next wave
            this.currentWaveIndex++;
            this.currentWaveRepeatCount = 0;
            this.spawnNextWave();
        }
    }

    private spawnNextWave() {
        if (this.currentWaveIndex >= this.config.waves.length) {
            this.isLevelComplete = true;
            console.log('Level Complete');
            return;
        }

        const waveConfig = this.config.waves[this.currentWaveIndex];
        this.spawnWave(waveConfig);
    }

    private spawnWave(waveConfig: WaveConfig) {
        console.log(`Spawning wave: ${waveConfig.formationType.name} with ${waveConfig.shipClass.name}`);
        this.currentWaveInstance = new waveConfig.formationType(
            this.scene,
            waveConfig.shipClass,
            this.collisionConfig,
            waveConfig.config
        );
        this.currentWaveInstance.spawn();
    }

    destroy() {
        if (this.currentWaveInstance) {
            this.currentWaveInstance.destroy();
        }
    }
}
