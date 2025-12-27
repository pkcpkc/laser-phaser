import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SinusTactic } from '../../../../src/scenes/shoot-em-ups/tactics/sinus-tactic';


describe('SinusTactic', () => {
    let sinusTactic: SinusTactic;
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
            startY: 0, // SPAWN_Y_OFFSET usually
            spawnTime: 1000,
            timeOffset: 0,
            verticalOffset: 0
        };

        mockFormation = {
            getShips: vi.fn().mockReturnValue([mockEnemy]),
            isComplete: vi.fn().mockReturnValue(false)
        };

        sinusTactic = new SinusTactic({
            amplitude: 50,
            frequency: 0.002,
            verticalSpeed: 100
        });
        sinusTactic.addFormation(mockFormation);
    });

    it('should update ship positions using sinus wave', () => {
        // BaseTactic.update calls updateFormation
        sinusTactic.update(2000, 16);

        expect(mockEnemy.ship.sprite.setPosition).toHaveBeenCalled();

        const call = (mockEnemy.ship.sprite.setPosition as any).mock.calls[0];
        const newX = call[0];
        const newY = call[1];

        // startX + sin(...) * amplitude
        // time = 2000, freq 0.002 -> phase 4.0
        // sin(4) approx -0.7568
        // 100 + (-0.7568 * 50) approx 62.16
        // newY should increase based on speed * time? 
        // Logic in SinusTactic: 
        // const elapsed = time - enemyData.spawnTime;
        // const newY = spawnY + verticalOffset + (speed * (elapsed / FRAME_DURATION_MS)); (Wait, check implementation)

        expect(newX).not.toBe(mockEnemy.startX);
        expect(newY).toBeGreaterThan(mockEnemy.startY);
    });

    it('should rotate ships', () => {
        sinusTactic.update(2000, 16);
        expect(mockEnemy.ship.sprite.setRotation).toHaveBeenCalled();
    });
});
