import { describe, it, expect, vi } from 'vitest';
import { generatePalette } from '../../../scripts/generate-color-palette';
import { MarkerConfig } from '../../../scripts/marker-config';

// Mock dependencies
vi.mock('fs', () => ({
    default: {
        createWriteStream: vi.fn(),
        existsSync: vi.fn(),
        mkdirSync: vi.fn(),
    }
}));

vi.mock('pngjs', () => {
    return {
        PNG: class MockPNG {
            width: number;
            height: number;
            data: Uint8Array;
            constructor(options: { width: number; height: number }) {
                this.width = options.width;
                this.height = options.height;
                this.data = new Uint8Array(options.width * options.height * 4);
            }
            pack() {
                return {
                    pipe: vi.fn()
                };
            }
        }
    };
});

describe('generate-color-palette', () => {
    it('should generate a palette without crashing', () => {
        // Since the real calculate is deterministic, we just run it and assume mocks catch the I/O
        // We verify that it runs through.

        expect(() => generatePalette()).not.toThrow();
    });

    it('should have keys in MarkerConfig', () => {
        expect(Object.keys(MarkerConfig.colors).length).toBeGreaterThan(0);
    });
});
