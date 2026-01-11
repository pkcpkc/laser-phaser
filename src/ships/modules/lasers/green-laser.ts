import { BaseLaser } from './base-laser';

export class GreenLaser extends BaseLaser {
    readonly TEXTURE_KEY = 'green-laser';
    readonly COLOR = 0x00ff00;
    readonly SPEED = 8;
    readonly damage = 12;
    readonly recoil = 0.05;
    readonly width = 4;
    readonly height = 4;
}
