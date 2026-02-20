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
import { ModuleType } from '../../../src/ships/modules/module-types';

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

        it('should return max firingDelay from weapon modules', () => {
            const MockWeapon1 = class { firingDelay = { min: 100, max: 200 }; type = ModuleType.LASER; };
            const MockWeapon2 = class { firingDelay = { min: 300, max: 400 }; type = ModuleType.LASER; };
            const MockDrive = class { type = ModuleType.DRIVE; };

            ship.config.modules = [
                { module: MockWeapon1 },
                { module: MockWeapon2 },
                { module: MockDrive }
            ] as any;

            expect(firing.getEffectiveFiringInterval()).toBe(300);
        });
    });

    describe('update', () => {
        it('should not fire when ship is inactive', () => {
            ship.sprite.active = false;
            firing.update(1000);
            expect(ship.fireLasers).not.toHaveBeenCalled();
        });

        it('should fire via space bar checkDown', () => {
            (scene.input.keyboard.checkDown as any).mockReturnValue(true);
            firing.update(1000);
            expect(ship.fireLasers).toHaveBeenCalled();
        });

        it('should fire when manual firing (isFiring = true)', () => {
            // Simulate pointerdown
            const button = new MockFireButton();
            firing.setFireButton(button as any);
            const pointerDownCall = (button.on as any).mock.calls.find((call: any) => call[0] === 'pointerdown');
            if (pointerDownCall) {
                const pointerDownCallback = pointerDownCall[1];
                pointerDownCallback();
            }

            firing.update(1000);
            expect(ship.fireLasers).toHaveBeenCalled();
        });

        it('should fire with autoFire enabled when time passes interval', () => {
            firing.update(1); // First fire at time 1
            expect(ship.fireLasers).toHaveBeenCalled();
        });

        it('should not fire again via autoFire until interval passes', () => {
            // Set an interval
            const MockWeapon = class { firingDelay = { min: 100, max: 200 }; type = ModuleType.LASER; };
            ship.config.modules = [{ module: MockWeapon }] as any;

            firing.update(101); // First fire (101 > 0 + 100)
            expect(ship.fireLasers).toHaveBeenCalled();
            ship.fireLasers.mockClear();

            firing.update(150); // Not enough time passed (150 < 101 + 100)
            expect(ship.fireLasers).not.toHaveBeenCalled();

            firing.update(202); // Enough time passed (202 > 101 + 100)
            expect(ship.fireLasers).toHaveBeenCalled();
        });
    });
});
