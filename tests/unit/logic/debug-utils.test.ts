import { describe, it, expect, vi } from 'vitest';
import { logChildRecursive, setupDebugKey } from '../../../src/logic/debug-utils';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            GameObjects: {
                GameObject: class { }
            },
            Scene: class { }
        }
    };
});

describe('debug-utils', () => {
    describe('logChildRecursive', () => {
        it('should log object details', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            const groupSpy = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => { });
            const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => { });

            const mockObj = {
                type: 'Sprite',
                name: 'test-sprite',
                x: 10,
                y: 20,
                active: true,
                visible: true,
                alpha: 1,
                texture: { key: 'test-tex' },
                frame: { name: 'frame1' }
            };

            logChildRecursive(mockObj as any);

            expect(groupSpy).toHaveBeenCalledWith(expect.stringContaining('Sprite "test-sprite"'));
            expect(consoleSpy).toHaveBeenCalledWith('Object:', mockObj);
            expect(consoleSpy).toHaveBeenCalledWith('Position:', { x: 10, y: 20 });
            expect(groupEndSpy).toHaveBeenCalled();

            vi.restoreAllMocks();
        });

        it('should recurse into children', () => {
            vi.spyOn(console, 'log').mockImplementation(() => { });
            const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => { });
            const groupCollapsedSpy = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => { });

            const mockChild = { type: 'Image', x: 0, y: 0 };
            const mockContainer = {
                type: 'Container',
                list: [mockChild],
                x: 0, y: 0
            };

            logChildRecursive(mockContainer as any);

            expect(groupSpy).toHaveBeenCalledWith('Children:');
            // Should be called recursively for child
            expect(groupCollapsedSpy).toHaveBeenCalledWith(expect.stringContaining('Image'));

            vi.restoreAllMocks();
        });

        it('should handle fallbacks for unknown types and missing names', () => {
            const groupSpy = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => { });
            const mockObj = { x: 0, y: 0 }; // No type, no name

            logChildRecursive(mockObj as any);

            expect(groupSpy).toHaveBeenCalledWith(expect.stringContaining('Object'));
            vi.restoreAllMocks();
        });

        it('should log body and texture if present', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            const mockObj = {
                type: 'Sprite',
                texture: { key: 'tex' },
                frame: { name: 'f1' },
                body: { some: 'matter-body' },
                x: 0, y: 0
            };

            logChildRecursive(mockObj as any);

            expect(consoleSpy).toHaveBeenCalledWith('Texture:', 'tex', 'f1');
            expect(consoleSpy).toHaveBeenCalledWith('Body:', { some: 'matter-body' });
            vi.restoreAllMocks();
        });
    });

    describe('setupDebugKey', () => {
        it('should register keyboard listener if debug flag is set', () => {
            const mockScene = {
                registry: { get: vi.fn().mockReturnValue(true) },
                input: {
                    keyboard: { on: vi.fn() }
                },
                matter: { world: { pause: vi.fn() } },
                scene: { key: 'Test' },
                children: { list: [] },
                game: { config: {} }
            };

            setupDebugKey(mockScene as any);
            expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-B', expect.any(Function));

            // Trigger the listener
            const callback = mockScene.input.keyboard.on.mock.calls[0][1];
            const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => { });
            callback();

            expect(mockScene.matter.world.pause).toHaveBeenCalled();
            expect(groupSpy).toHaveBeenCalledWith(expect.stringContaining('Render Tree'));

            vi.restoreAllMocks();
        });

        it('should NOT register keyboard listener if NOT in debug mode', () => {
            const mockScene = {
                registry: { get: vi.fn().mockReturnValue(false) },
                input: {
                    keyboard: { on: vi.fn() }
                }
            };

            setupDebugKey(mockScene as any);
            expect(mockScene.input.keyboard.on).not.toHaveBeenCalled();
        });
    });
});
