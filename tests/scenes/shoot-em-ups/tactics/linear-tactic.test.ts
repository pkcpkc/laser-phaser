import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinearTactic } from '../../../../src/scenes/shoot-em-ups/tactics/linear-tactic';

describe('LinearTactic', () => {
    let linearTactic: LinearTactic;
    let mockFormation: any;
    let mockEnemy: any;

    beforeEach(() => {
        mockEnemy = {
            ship: {
                sprite: {
                    setPosition: vi.fn(),
                    setRotation: vi.fn(),
                    setVelocity: vi.fn(),
                    x: 0,
                    y: 0,
                    active: true,
                    scene: {
                        scale: {
                            width: 800,
                            height: 600
                        }
                    }
                },
                config: {
                    definition: {
                        gameplay: {
                            speed: 100
                        }
                    }
                }
            },
            startX: 100,
            startY: 0,
            spawnTime: 1000
        };

        mockFormation = {
            getShips: vi.fn().mockReturnValue([mockEnemy]),
            isComplete: vi.fn().mockReturnValue(false)
        };
    });

    it('should move ships straight down by default (angle PI/2)', () => {
        linearTactic = new LinearTactic({
            speed: 100
        });
        linearTactic.addFormation(mockFormation);

        linearTactic.update(2000, 16);

        const call = (mockEnemy.ship.sprite.setPosition as any).mock.calls[0];
        const newX = call[0];
        const newY = call[1];

        // Angle defaults to PI/2 (down)
        // cos(PI/2) = 0 -> X shouldn't change
        // sin(PI/2) = 1 -> Y should increase

        expect(newX).toBeCloseTo(mockEnemy.startX, 0); // Might be float errors
        expect(newY).toBeGreaterThan(mockEnemy.startY);
    });

    it('should move ships at specified angle', () => {
        linearTactic = new LinearTactic({
            speed: 100,
            angle: 0 // Right
        });
        linearTactic.addFormation(mockFormation);

        linearTactic.update(2000, 16);

        const call = (mockEnemy.ship.sprite.setPosition as any).mock.calls[0];
        const newX = call[0];
        const newY = call[1];

        expect(newX).toBeGreaterThan(mockEnemy.startX);
        expect(newY).toBeCloseTo(mockEnemy.startY, 0);
    });
});
