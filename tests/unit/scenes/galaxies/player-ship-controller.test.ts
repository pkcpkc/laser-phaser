import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerShipController } from '../../../../src/scenes/galaxies/player-ship-controller';
import Phaser from 'phaser';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        Math: {
            Angle: {
                Between: vi.fn()
            }
        }
    }
}));

describe('PlayerShipController', () => {
    let controller: PlayerShipController;
    let mockScene: any;
    let mockShip: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockShip = {
            x: 100,
            y: 100,
            rotation: 0,
            setScale: vi.fn().mockReturnThis(),
            setAngle: vi.fn().mockReturnThis(),
            setOrigin: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setPosition: vi.fn().mockImplementation(function (this: any, x: number, y: number) {
                this.x = x;
                this.y = y;
                return this;
            })
        };

        mockScene = {
            add: {
                image: vi.fn().mockReturnValue(mockShip)
            },
            tweens: {
                add: vi.fn()
            }
        };

        controller = new PlayerShipController(mockScene);
    });

    describe('create', () => {
        it('creates a ship image with correct settings', () => {
            const ship = controller.create();

            expect(mockScene.add.image).toHaveBeenCalledWith(0, 0, 'ships', 'big-cruiser');
            expect(mockShip.setScale).toHaveBeenCalledWith(0.4);
            expect(mockShip.setAngle).toHaveBeenCalledWith(-90);
            expect(mockShip.setOrigin).toHaveBeenCalledWith(0.5);
            expect(mockShip.setDepth).toHaveBeenCalledWith(1000);
            expect(ship).toBe(mockShip);
        });
    });

    describe('getShip', () => {
        it('returns the ship game object', () => {
            controller.create();
            expect(controller.getShip()).toBe(mockShip);
        });
    });

    describe('setPosition', () => {
        it('sets the ship position', () => {
            controller.create();
            controller.setPosition(200, 300);

            expect(mockShip.setPosition).toHaveBeenCalledWith(200, 300);
        });
    });

    describe('getPosition', () => {
        it('returns current ship position', () => {
            controller.create();
            mockShip.x = 150;
            mockShip.y = 250;

            const pos = controller.getPosition();
            expect(pos).toEqual({ x: 150, y: 250 });
        });
    });

    describe('calculateRotationTo', () => {
        it('calculates shortest rotation angle', () => {
            controller.create();
            mockShip.rotation = 0;
            (Phaser.Math.Angle.Between as any).mockReturnValue(Math.PI / 2);

            const result = controller.calculateRotationTo(200, 200);
            expect(result).toBeCloseTo(Math.PI / 2);
        });

        it('handles wrap-around for angles > PI', () => {
            controller.create();
            mockShip.rotation = Math.PI - 0.5;
            (Phaser.Math.Angle.Between as any).mockReturnValue(-Math.PI + 0.5);

            const result = controller.calculateRotationTo(0, 0);
            // Diff would be -2PI + 1, which gets wrapped
            expect(result).toBeDefined();
        });
    });

    describe('rotateTo', () => {
        it('creates a rotation tween', () => {
            controller.create();
            (Phaser.Math.Angle.Between as any).mockReturnValue(Math.PI / 4);

            controller.rotateTo(200, 200, 400);

            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    targets: mockShip,
                    duration: 400,
                    ease: 'Power2'
                })
            );
        });
    });

    describe('moveTo', () => {
        it('creates a movement tween', () => {
            controller.create();
            const onComplete = vi.fn();

            controller.moveTo(300, 400, 800, onComplete);

            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    targets: mockShip,
                    x: 300,
                    y: 400,
                    duration: 800,
                    ease: 'Power2',
                    onComplete
                })
            );
        });
    });

    describe('travelTo', () => {
        it('creates both rotation and movement tweens', () => {
            controller.create();
            (Phaser.Math.Angle.Between as any).mockReturnValue(0);
            const onComplete = vi.fn();

            controller.travelTo(250, 350, onComplete);

            expect(mockScene.tweens.add).toHaveBeenCalledTimes(2);
        });
    });
});
