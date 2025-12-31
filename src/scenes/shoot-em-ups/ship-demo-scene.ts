import { ShootEmUpScene } from './shoot-em-up-scene';
import { ShipDemoLevel } from './levels/ship-demo-level';

export default class ShipDemoScene extends ShootEmUpScene {
    constructor() {
        // Use the key 'ShipDemoScene' which we will reference in galaxy-interaction
        super('ShipDemoScene');
        // Reuse the nebula background
        this.backgroundTexture = 'blood_nebula';
        this.backgroundFrame = undefined;
    }

    protected getLevelClass() {
        return ShipDemoLevel;
    }
}
