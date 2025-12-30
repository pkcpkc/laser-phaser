import type { ShipConfig } from '../types';
import { BloodBossDefinition } from '../definitions/blood-boss';
import { RedLaser } from '../modules/lasers/red-laser';
import { BigRedLaser } from '../modules/lasers/big-red-laser';
import { BloodRocket } from '../modules/rockets/blood-rocket';
import { RedThrusterDrive } from '../modules/drives/red-thruster-drive';
import { LootType } from '../types';

export const BloodBossConfig: ShipConfig = {
    definition: BloodBossDefinition,
    modules: [
        // 4 Red Lasers
        ...BloodBossDefinition.markers
            .filter(m => m.type === 'laser')
            .map((m, i) => ({
                marker: m,
                module: (i % 2 === 0) ? BigRedLaser : RedLaser
            })),

        // 2 Blood Rockets
        ...BloodBossDefinition.markers
            .filter(m => m.type === 'rocket')
            .map(m => ({ marker: m, module: BloodRocket })),

        // 2 Big Red Thrusters
        ...BloodBossDefinition.markers
            .filter(m => m.type === 'drive')
            .map(m => ({ marker: m, module: RedThrusterDrive }))
    ],
    loot: [
        {
            type: LootType.GOLD,
            dropChance: 1.0 // Guaranteed Gold
        },
        {
            type: LootType.MODULE,
            dropChance: 0.5 // 50% Module chance
        }
    ]
};
