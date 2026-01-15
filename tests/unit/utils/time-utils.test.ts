import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeUtils } from '../../../src/utils/time-utils';

// Determine environment based on baked-in Define replacement
const isE2E = import.meta.env.TEST_E2E === 'true' || import.meta.env.TEST_E2E === true;

describe.skipIf(isE2E)('TimeUtils (Standard Mode)', () => {
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

describe('TimeUtils (E2E Mode)', () => {
    let mockScene: any;

    beforeEach(() => {
        vi.useFakeTimers();
        TimeUtils.setForceE2EForTesting(true);

        // Mock window.setTimeout
        vi.spyOn(window, 'setTimeout');
        vi.spyOn(window, 'clearTimeout');

        mockScene = {
            sys: {
                isActive: vi.fn().mockReturnValue(true)
            },
            time: {
                delayedCall: vi.fn()
            }
        };
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        TimeUtils.setForceE2EForTesting(false);
    });

    describe('delayedCall', () => {
        it('should use window.setTimeout instead of scene.time.delayedCall', () => {
            const callback = vi.fn();
            const delay = 500;

            TimeUtils.delayedCall(mockScene, delay, callback);

            expect(window.setTimeout).toHaveBeenCalledWith(expect.any(Function), delay);
            expect(mockScene.time.delayedCall).not.toHaveBeenCalled();
        });

        it('should return a mock TimerEvent object', () => {
            const callback = vi.fn();
            const result = TimeUtils.delayedCall(mockScene, 100, callback);

            expect(result).toHaveProperty('remove');
            expect(result).toHaveProperty('destroy');
            expect(result.delay).toBe(100);
        });

        it('should execute callback if scene is active', () => {
            const callback = vi.fn();
            TimeUtils.delayedCall(mockScene, 500, callback);

            vi.runAllTimers();

            expect(callback).toHaveBeenCalled();
        });

        it('should NOT execute callback if scene is not active', () => {
            const callback = vi.fn();
            mockScene.sys.isActive.mockReturnValue(false);

            TimeUtils.delayedCall(mockScene, 500, callback);

            vi.runAllTimers();

            expect(callback).not.toHaveBeenCalled();
        });

        it('should allow cancellation via remove/destroy', () => {
            const callback = vi.fn();
            const timerEvent = TimeUtils.delayedCall(mockScene, 500, callback);

            timerEvent.remove();

            vi.runAllTimers();

            expect(callback).not.toHaveBeenCalled();
            expect(window.clearTimeout).toHaveBeenCalled();
        });
    });
});
