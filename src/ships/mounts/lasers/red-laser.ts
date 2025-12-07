import { BaseLaser } from './base-laser';

export class RedLaser extends BaseLaser {
    readonly TEXTURE_KEY = 'red-laser';
    readonly COLOR = 0xff0000;
    readonly SPEED = 5;
    readonly width = 2;
    readonly height = 2;
}
