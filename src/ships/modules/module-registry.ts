import { RedLaser } from './lasers/red-laser';
import { GreenLaser } from './lasers/green-laser';
import { WhiteLaser } from './lasers/white-laser';
import { BigRedLaser } from './lasers/big-red-laser';
import { BloodRocket } from './rockets/blood-rocket';
import { GreenRocket } from './rockets/green-rocket';
import { IonDrive } from './drives/ion-drive';
import { RedThrusterDrive } from './drives/red-thruster-drive';
import { DustDrive } from './drives/dust-drive';
import { LootType } from '../types';
import type { ShipModule } from './module-types';

export const DIAMOND_TO_GOLD_RATIO = 20;

export interface ModuleBuyPrice {
    type: LootType;
    amount: number;
}

export interface ModuleStats {
    damage?: number;
    fireRate?: number;
    thrust?: number;
}

export interface ModuleRegistryEntry {
    id: string;
    name: string;
    description: string;
    moduleClass: new () => ShipModule;
    buyPrice: ModuleBuyPrice;
    stats?: ModuleStats;
}

export const ModuleRegistry: Record<string, ModuleRegistryEntry> = {
    'laser-red': {
        id: 'laser-red',
        name: 'Red Laser',
        description: 'A basic red laser. Reliable, but weak.',
        moduleClass: RedLaser,
        buyPrice: { type: LootType.SILVER, amount: 20 },
        stats: { damage: 5, fireRate: 650 }
    },
    'laser-green': {
        id: 'laser-green',
        name: 'Green Laser',
        description: 'A faster firing green laser.',
        moduleClass: GreenLaser,
        buyPrice: { type: LootType.SILVER, amount: 50 },
        stats: { damage: 5, fireRate: 350 }
    },
    'laser-white': {
        id: 'laser-white',
        name: 'White Laser',
        description: 'A powerful white laser with high damage.',
        moduleClass: WhiteLaser,
        buyPrice: { type: LootType.GOLD, amount: 5 },
        stats: { damage: 15, fireRate: 850 }
    },
    'laser-big-red': {
        id: 'laser-big-red',
        name: 'Heavy Red Laser',
        description: 'A heavy, slow firing red laser that packs a punch.',
        moduleClass: BigRedLaser,
        buyPrice: { type: LootType.GOLD, amount: 10 },
        stats: { damage: 25, fireRate: 1500 }
    },
    'rocket-blood': {
        id: 'rocket-blood',
        name: 'Blood Rocket',
        description: 'A devastating blood rocket.',
        moduleClass: BloodRocket,
        buyPrice: { type: LootType.GOLD, amount: 25 },
        stats: { damage: 15, fireRate: 2000 }
    },
    'rocket-green': {
        id: 'rocket-green',
        name: 'Green Rocket',
        description: 'A swift green rocket.',
        moduleClass: GreenRocket,
        buyPrice: { type: LootType.GOLD, amount: 15 },
        stats: { damage: 10, fireRate: 800 }
    },
    'drive-ion': {
        id: 'drive-ion',
        name: 'Ion Drive',
        description: 'Standard reliable ion drive.',
        moduleClass: IonDrive,
        buyPrice: { type: LootType.SILVER, amount: 100 },
        stats: { thrust: 0.05 }
    },
    'drive-red-thruster': {
        id: 'drive-red-thruster',
        name: 'Red Thruster',
        description: 'High performance red thruster.',
        moduleClass: RedThrusterDrive,
        buyPrice: { type: LootType.GOLD, amount: 10 },
        stats: { thrust: 0.08 }
    },
    'drive-dust': {
        id: 'drive-dust',
        name: 'Dust Drive',
        description: 'Experimental dust drive.',
        moduleClass: DustDrive,
        buyPrice: { type: LootType.GEM, amount: 2 },
        stats: { thrust: 0.12 }
    }
};

/**
 * Calculates the sell price of a module.
 * Returns 50% of the buy price.
 * Converts GEM to GOLD at 1:DIAMOND_TO_GOLD_RATIO.
 */
export function calculateSellPrice(moduleId: string): ModuleBuyPrice | null {
    const entry = ModuleRegistry[moduleId];
    if (!entry) return null;

    let sellAmount = Math.floor(entry.buyPrice.amount * 0.5);
    let sellType = entry.buyPrice.type;

    if (sellType === LootType.GEM) {
        sellType = LootType.GOLD;
        // The original price was X gems. 50% is (X * 0.5) gems.
        // Convert that to Gold via ratio: (X * 0.5) * DIAMOND_TO_GOLD_RATIO
        sellAmount = Math.floor(entry.buyPrice.amount * DIAMOND_TO_GOLD_RATIO * 0.5);
    }

    // Ensure at least 1 returned if it was > 0 originally
    if (sellAmount < 1 && entry.buyPrice.amount > 0) {
        sellAmount = 1;
    }

    return { type: sellType, amount: sellAmount };
}
