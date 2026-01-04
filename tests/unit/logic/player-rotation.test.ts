vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                RadToDeg: (rad: number) => rad * (180 / Math.PI)
            }
        }
    };
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerRotation } from '../../../src/logic/player-rotation';

class MockScene {
    tweens = {
        add: vi.fn(() => ({
            stop: vi.fn()
        }))
    };
}

class MockSprite {
    active = true;
    angle = 0;
    setAngle = vi.fn((angle: number) => { this.angle = angle; });
}

describe('PlayerRotation', () => {
    let scene: MockScene;
    let sprite: MockSprite;
    let rotation: PlayerRotation;

    beforeEach(() => {
        scene = new MockScene();
        sprite = new MockSprite();
        rotation = new PlayerRotation(scene as any, sprite as any);
    });

    describe('tiltDirection', () => {
        it('should start with none', () => {
            expect(rotation.tiltDirection).toBe('none');
        });
    });

    describe('pointToAngle', () => {
        it('should update sprite angle using lerp', () => {
            rotation.pointToAngle(Math.PI / 2); // 90 degrees

            expect(sprite.setAngle).toHaveBeenCalled();
            expect(rotation.tiltDirection).toBe('moving');
        });

        it('should not update if sprite is inactive', () => {
            sprite.active = false;

            rotation.pointToAngle(Math.PI / 2);

            expect(sprite.setAngle).not.toHaveBeenCalled();
        });

        it('should stop existing tween before setting new angle', () => {
            // First create a tween by returning to upright
            rotation.setMoving();
            rotation.returnToUpright();
            const stopMock = scene.tweens.add.mock.results[0].value.stop;

            // Now point to angle should stop the tween
            rotation.pointToAngle(Math.PI / 4);

            expect(stopMock).toHaveBeenCalled();
        });
    });

    describe('returnToUpright', () => {
        it('should create tween to angle -90', () => {
            rotation.setMoving();
            rotation.returnToUpright();

            expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
                targets: sprite,
                angle: -90
            }));
        });

        it('should not tween if already none', () => {
            rotation.returnToUpright();

            expect(scene.tweens.add).not.toHaveBeenCalled();
        });

        it('should not tween if sprite is inactive', () => {
            rotation.setMoving();
            sprite.active = false;

            rotation.returnToUpright();

            expect(scene.tweens.add).not.toHaveBeenCalled();
        });
    });

    describe('setMoving', () => {
        it('should set tilt direction to moving', () => {
            rotation.setMoving();

            expect(rotation.tiltDirection).toBe('moving');
        });
    });

    describe('destroy', () => {
        it('should stop active tween', () => {
            rotation.setMoving();
            rotation.returnToUpright();
            const stopMock = scene.tweens.add.mock.results[0].value.stop;

            rotation.destroy();

            expect(stopMock).toHaveBeenCalled();
        });

        it('should not throw if no tween active', () => {
            expect(() => rotation.destroy()).not.toThrow();
        });
    });
});
