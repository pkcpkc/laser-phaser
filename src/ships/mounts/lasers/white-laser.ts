import { BaseLaser } from './base-laser';

export class WhiteLaser extends BaseLaser {
    readonly TEXTURE_KEY = 'laser';
    readonly COLOR = 0xffffff;
    readonly SPEED = 10;
    readonly recoil = 0.02;
}
