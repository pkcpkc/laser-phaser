vi.mock('phaser', () => {
    return {
        default: {
            GameObjects: {
                Text: class { }
            },
            Physics: {
                Matter: {
                    Image: class { }
                }
            }
        }
    };
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerFiring } from '../../../src/logic/player-firing';
import type { Ship } from '../../../src/ships/ship';

class MockScene {
    input = {
        keyboard: {
            checkDown: vi.fn(() => false)
        }
    };
}

class MockShip {
    sprite = {
        active: true
    };
    config = {
        modules: []
    };
    fireLasers = vi.fn();
}

class MockFireButton {
    private bounds = { contains: vi.fn(() => false) };
    getBounds = () => this.bounds;
    on = vi.fn(() => this);
}

describe('PlayerFiring', () => {
    let scene: MockScene;
    let ship: MockShip;
    let cursors: any;
    let firing: PlayerFiring;

    beforeEach(() => {
        scene = new MockScene();
        ship = new MockShip();
        cursors = {
            space: { isDown: false }
        };
        firing = new PlayerFiring(scene as any, ship as unknown as Ship, cursors);
    });

    describe('getFireButton', () => {
        it('should return null initially', () => {
            expect(firing.getFireButton()).toBeNull();
        });
    });

    describe('setFireButton', () => {
        it('should register event listeners on fire button', () => {
            const button = new MockFireButton();

            firing.setFireButton(button as any);

            expect(button.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
            expect(button.on).toHaveBeenCalledWith('pointerup', expect.any(Function));
            expect(button.on).toHaveBeenCalledWith('pointerout', expect.any(Function));
        });
    });

    describe('isClickingFireButton', () => {
        it('should return false when no fire button set', () => {
            const pointer = { x: 100, y: 100 } as any;

            expect(firing.isClickingFireButton(pointer)).toBe(false);
        });

        it('should check if pointer is within fire button bounds', () => {
            const button = new MockFireButton();
            button.getBounds().contains.mockReturnValue(true);
            firing.setFireButton(button as any);

            const pointer = { x: 100, y: 100 } as any;
            expect(firing.isClickingFireButton(pointer)).toBe(true);
        });
    });

    describe('getEffectiveFiringInterval', () => {
        it('should return 0 when no modules', () => {
            expect(firing.getEffectiveFiringInterval()).toBe(0);
        });
    });

    describe('update', () => {
        it('should not fire when ship is inactive', () => {
            ship.sprite.active = false;

            firing.update(1000);

            expect(ship.fireLasers).not.toHaveBeenCalled();
        });

        it('should fire with autoFire enabled when time passes interval', () => {
            firing.update(1); // First fire at time 1 (> 0 + 0)

            expect(ship.fireLasers).toHaveBeenCalled();
        });

        it('should not fire again until interval passes', () => {
            firing.update(1); // First fire at time 1
            ship.fireLasers.mockClear();

            firing.update(1); // Same time, should not fire again

            expect(ship.fireLasers).not.toHaveBeenCalled();
        });
    });
});
