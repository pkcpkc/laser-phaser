import { BaseLaser } from './base-laser';

export class BigRedLaser extends BaseLaser {
    readonly TEXTURE_KEY = 'big-red-laser';
    readonly COLOR = 0xff0000;
    readonly SPEED = 5;
    readonly width = 4;
    readonly height = 4.;
}
