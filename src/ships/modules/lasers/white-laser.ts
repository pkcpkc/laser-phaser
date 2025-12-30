import { BaseLaser } from './base-laser';

export class WhiteLaser extends BaseLaser {
    readonly TEXTURE_KEY = 'laser';
    readonly COLOR = 0xffffff;
    readonly SPEED = 10;
    readonly damage = 5;
    readonly width = 4;
    readonly height = 4;
    readonly reloadTime = 300; // Fast firing light laser
}
