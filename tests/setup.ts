import 'reflect-metadata';

import { vi } from 'vitest';

// Mock Canvas for Phaser
if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
        createImageData: vi.fn(() => []),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
    })) as any;
}

// Ensure localStorage is available and fully functional in test environment (handling Node 22+ quirks)
const createInMemoryStorage = () => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = String(value); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        key: (index: number) => Object.keys(store)[index] ?? null,
        get length() { return Object.keys(store).length; },
    };
};

if (typeof window !== 'undefined') {
    if (!window.localStorage || typeof window.localStorage.clear !== 'function') {
        const mockStorage = createInMemoryStorage();
        Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true, configurable: true });
        Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, writable: true, configurable: true });
    }
}

