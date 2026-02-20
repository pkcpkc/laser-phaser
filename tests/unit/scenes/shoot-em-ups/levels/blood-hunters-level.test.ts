import { describe, it, expect, vi } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            Physics: {
                Matter: {
                    Image: class { }
                }
            }
        }
    };
});

import { BloodHuntersLevel } from '../../../../../src/scenes/shoot-em-ups/levels/blood-hunters-level.ts';

describe('BloodHuntersLevel', () => {
    it('should have correct name', () => {
        expect(BloodHuntersLevel.name).toBe('Blood Hunters');
    });

    it('should have valid formations (5 waves, max 3 ships per formation)', () => {
        expect(BloodHuntersLevel.formations).toHaveLength(5);

        // Verification of ship counts to ensure they don't exceed 3 per wave item
        for (const step of BloodHuntersLevel.formations) {
            for (const formation of step) {
                const grid = formation.config?.shipFormationGrid;
                if (grid) {
                    let totalShips = 0;
                    for (const row of grid) {
                        totalShips += (row as any[]).filter(c => c !== null).length;
                    }
                    expect(totalShips).toBeLessThanOrEqual(3);
                }
            }
        }

        // Specific wave checks
        // Wave 1: 2 Blood Hunters
        const wave1 = BloodHuntersLevel.formations[0];
        expect(wave1[0].config?.shipFormationGrid[0]).toHaveLength(2);

        // Wave 5: 2 separate formations
        const wave5 = BloodHuntersLevel.formations[4];
        expect(wave5).toHaveLength(2);

        // Formation A: 3 Blood Hunters
        expect(wave5[0].config?.shipFormationGrid[0]).toHaveLength(3);

        // Formation B: 2 Blood Bombers
        expect(wave5[1].config?.shipFormationGrid).toHaveLength(2);
        expect(wave5[1].config?.shipFormationGrid[0]).toHaveLength(1);
        expect(wave5[1].config?.shipFormationGrid[1]).toHaveLength(1);
    });
});
