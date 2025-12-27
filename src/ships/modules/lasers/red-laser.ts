import { BaseLaser } from './base-laser';

export class RedLaser extends BaseLaser {
    readonly TEXTURE_KEY = 'red-laser-v2';
    readonly COLOR = 0xff0000;
    readonly SPEED = 5;
    readonly width = 3;
    readonly height = 3;
    readonly reloadTime = 450; // Standard firing rate
}
