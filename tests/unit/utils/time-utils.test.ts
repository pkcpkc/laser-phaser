import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeUtils } from '../../../src/utils/time-utils';

// Mock import.meta.env
vi.mock('import.meta', () => ({
    env: { TEST_E2E: false }
}));

describe('TimeUtils', () => {
    let mockScene: any;
    let mockTimerEvent: any;

    beforeEach(() => {
        vi.useFakeTimers();

        mockTimerEvent = {
            remove: vi.fn(),
            destroy: vi.fn()
        };

        mockScene = {
            sys: {
                isActive: vi.fn().mockReturnValue(true)
            },
            time: {
                delayedCall: vi.fn().mockReturnValue(mockTimerEvent)
            }
        };
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('delayedCall', () => {
        it('should call scene.time.delayedCall in normal mode', () => {
            const callback = vi.fn();
            const delay = 1000;

            TimeUtils.delayedCall(mockScene, delay, callback);

            expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
                delay,
                callback,
                undefined,
                mockScene
            );
        });

        it('should return the TimerEvent from scene.time.delayedCall', () => {
            const callback = vi.fn();
            const result = TimeUtils.delayedCall(mockScene, 1000, callback);

            expect(result).toBe(mockTimerEvent);
        });

        it('should pass args to scene.time.delayedCall', () => {
            const callback = vi.fn();
            const args = [1, 2, 3];

            TimeUtils.delayedCall(mockScene, 1000, callback, args);

            expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
                1000,
                callback,
                args,
                mockScene
            );
        });
    });
});
