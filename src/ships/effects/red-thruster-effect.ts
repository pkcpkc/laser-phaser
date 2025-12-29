import Phaser from 'phaser';
import { ThrusterEffect } from './thruster-effect';

/**
 * Red thruster effect with red/orange flame colors.
 */
export class RedThrusterEffect extends ThrusterEffect {
    constructor(scene: Phaser.Scene, module: Phaser.GameObjects.Image) {
        super(scene, module, {
            outer: [0xff2200, 0xaa0000],
            core: [0xff6600, 0xff4400],
            inner: [0xffdd88, 0xffaa44],
            sparks: [0xffeecc, 0xff8844],
            lengthScale: 0.6
        });
    }
}
