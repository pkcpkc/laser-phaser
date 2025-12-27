import Phaser from 'phaser';
import { ThrusterEffect, THRUSTER_COLORS } from './thruster-effect';

/**
 * Ion thruster effect with blue/cyan flame colors.
 */
export class IonEffect extends ThrusterEffect {
    constructor(scene: Phaser.Scene, module: Phaser.GameObjects.Image) {
        super(scene, module, THRUSTER_COLORS.ION);
    }
}
