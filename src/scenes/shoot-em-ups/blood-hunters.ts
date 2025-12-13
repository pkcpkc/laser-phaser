import { ShootEmUpScene } from './shoot-em-up-scene';
import { BloodHuntersLevel } from '../../levels/blood-hunters-level';

export default class BloodHuntersScene extends ShootEmUpScene {
    constructor() {
        super('BloodHunters');
    }

    protected getLevelClass() {
        return BloodHuntersLevel;
    }
}
