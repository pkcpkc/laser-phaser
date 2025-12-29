import Phaser from 'phaser';
import { ThrusterEffect } from './thruster-effect';

/**
 * Ion thruster effect with blue/cyan flame colors.
 */
export class IonEffect extends ThrusterEffect {
    constructor(scene: Phaser.Scene, module: Phaser.GameObjects.Image) {
        super(scene, module, {
            outer: [0x0044aa, 0x002255],
            core: [0x00ffff, 0x0088ff],
            inner: [0xffffff, 0xddddff],
            sparks: [0xffffff, 0xaaddff]
        });
    }
}
