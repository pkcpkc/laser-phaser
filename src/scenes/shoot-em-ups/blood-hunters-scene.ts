import { ShootEmUpScene } from './shoot-em-up-scene';
import { BloodHuntersLevel } from './levels/blood-hunters-level';

export default class BloodHuntersScene extends ShootEmUpScene {
    constructor() {
        super('BloodHunters');
        this.backgroundTexture = 'blood_nebula';
        this.backgroundFrame = undefined;
    }

    protected getLevelClass() {
        return BloodHuntersLevel;
    }
}
