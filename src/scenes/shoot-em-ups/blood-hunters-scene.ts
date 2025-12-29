import { ShootEmUpScene } from './shoot-em-up-scene';
import { BloodHuntersLevel } from './levels/blood-hunters-level';
import { getLevelConfig } from './level-registry';

export default class BloodHuntersScene extends ShootEmUpScene {
    constructor() {
        super('BloodHunters');
        this.backgroundTexture = 'blood_nebula';
        this.backgroundFrame = undefined;
    }

    protected getLevelClass() {
        // Dynamic level lookup from registry
        if (this.levelId) {
            const levelConfig = getLevelConfig(this.levelId);
            if (levelConfig) {
                return levelConfig;
            }
            console.warn(`Level '${this.levelId}' not found in registry, using default`);
        }
        return BloodHuntersLevel;
    }
}
