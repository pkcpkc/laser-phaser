import type { ShipModule, ModuleType } from '../module-types';

/**
 * Drive module interface - extends ShipModule with thrust properties
 */
export interface Drive extends ShipModule {
    readonly type: ModuleType.DRIVE;
    readonly thrust: number;
    readonly name: string;
    readonly description: string;
}
