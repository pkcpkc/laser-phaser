import { BaseLaser } from './base-laser';

export class RedLaser extends BaseLaser {
    readonly TEXTURE_KEY = 'enemy-laser';
    readonly COLOR = 0xff0000;
    readonly SPEED = 5;
}
