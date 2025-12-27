import Phaser from 'phaser';
import { ThrusterEffect, THRUSTER_COLORS } from './thruster-effect';

/**
 * Red thruster effect with red/orange flame colors.
 */
export class RedThrusterEffect extends ThrusterEffect {
    constructor(scene: Phaser.Scene, module: Phaser.GameObjects.Image) {
        super(scene, module, THRUSTER_COLORS.RED);
    }
}
