import { describe, it, expect, vi } from 'vitest';
import { SingleShipFormation } from '../../../../../src/scenes/shoot-em-ups/formations/single-ship-formation';
import { DiamondFormation } from '../../../../../src/scenes/shoot-em-ups/formations/diamond-formation';
// Mock Phaser
// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            Math: {
                Vector2: class { x = 0; y = 0; },
            },
            Physics: {
                Matter: {
                    Image: class { }
                }
            },
            GameObjects: {
                Sprite: class { }
            }
        }
    };
});

import Phaser from 'phaser';

// Mock dependencies
const mockScene = {
    scale: { width: 800, height: 600 }
} as unknown as Phaser.Scene;
const mockShipClass = vi.fn();
const mockCollisionConfig = {};

describe('SingleShipFormation', () => {
    it('should extend DiamondFormation', () => {
        const formation = new SingleShipFormation(mockScene, mockShipClass as any, mockCollisionConfig as any, {});
        expect(formation).toBeInstanceOf(DiamondFormation);
    });

    it('should force formationGrid to [1]', () => {
        const formation = new SingleShipFormation(mockScene, mockShipClass as any, mockCollisionConfig as any, {
            formationGrid: [1, 2, 3] // Try to override
        });

        // We can't access config directly as it is protected in DiamondFormation (usually), 
        // but we can trust the constructor logic if the code is correct.
        // Or we can cast to any to peek.
        expect((formation as any).config.formationGrid).toEqual([1]);
    });
});
