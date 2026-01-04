import type { ShipModule } from '../module-types';

/**
 * Drive module interface - extends ShipModule with thrust properties
 */
export interface Drive extends ShipModule {
    readonly thrust: number;
    readonly name: string;
    readonly description: string;
}
