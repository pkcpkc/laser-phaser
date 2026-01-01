
import { describe, it, expect } from 'vitest';
import type { CollisionHandler } from '../../../../src/logic/collision-handlers/collision-handler.interface';

describe('CollisionHandler Interface', () => {
    it('should be implementable', () => {
        // This is a type-check implementation test
        class MockHandler implements CollisionHandler {
            handle(
                _scene: Phaser.Scene,
                _categoryA: number,
                _categoryB: number,
                _gameObjectA: Phaser.GameObjects.GameObject | null,
                _gameObjectB: Phaser.GameObjects.GameObject | null
            ): boolean {
                return true;
            }
        }

        const handler = new MockHandler();
        expect(handler.handle(
            {} as any,
            1,
            2,
            {} as any,
            {} as any
        )).toBe(true);
    });
});
