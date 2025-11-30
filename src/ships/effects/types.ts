import type { Ship } from '../ship';

export interface ShipEffect {
    destroy(): void;
}

export interface ShipEffectConstructor {
    new(ship: Ship): ShipEffect;
}
