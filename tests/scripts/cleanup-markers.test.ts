
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { cleanupMarkers } from '../../scripts/cleanup-markers';
import { MarkerConfig } from '../../scripts/marker-config';

const TEST_DIR = 'res/ships';
const TEST_INPUT = 'test_cleanup_input.png';
const TEST_OUTPUT = 'test_cleanup_output.png';
const INPUT_PATH = path.join(TEST_DIR, TEST_INPUT);
const OUTPUT_PATH = path.join(TEST_DIR, TEST_OUTPUT);

describe('Marker Cleanup', () => {
    beforeAll(() => {
        if (!fs.existsSync(TEST_DIR)) {
            fs.mkdirSync(TEST_DIR, { recursive: true });
        }
        createTestPngWithMarkers(INPUT_PATH);
    });

    afterAll(() => {
        if (fs.existsSync(INPUT_PATH)) fs.unlinkSync(INPUT_PATH);
        if (fs.existsSync(OUTPUT_PATH)) fs.unlinkSync(OUTPUT_PATH);
    });

    it('should remove marker colors from PNG', () => {
        cleanupMarkers(INPUT_PATH, OUTPUT_PATH);

        expect(fs.existsSync(OUTPUT_PATH)).toBe(true);

        const data = fs.readFileSync(OUTPUT_PATH);
        const png = PNG.sync.read(data);

        // Check that marker colors are gone
        let foundMarkerColor = false;
        let foundOrientationColor = false;

        for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
                const idx = (png.width * y + x) << 2;
                const r = png.data[idx];
                const g = png.data[idx + 1];
                const b = png.data[idx + 2];
                const a = png.data[idx + 3];

                if (a === 0) continue; // Skip transparent

                // Check for marker colors using the helper
                const hex = MarkerConfig.rgbaToHex(r, g, b, a);
                const isMarker = MarkerConfig.getType(hex) !== null;

                if (isMarker) foundMarkerColor = true;
                if (isMarker) foundOrientationColor = true;
            }
        }

        expect(foundMarkerColor).toBe(false);
        expect(foundOrientationColor).toBe(false);
    });

    it('should preserve non-marker pixels', () => {
        cleanupMarkers(INPUT_PATH, OUTPUT_PATH);

        const data = fs.readFileSync(OUTPUT_PATH);
        const png = PNG.sync.read(data);

        // Check that the blue pixel (non-marker) is still there
        const idx = (png.width * 30 + 30) << 2;
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];

        // Should still be blue (or very close to it)
        expect(r).toBeLessThan(10);
        expect(g).toBeLessThan(10);
        expect(b).toBeGreaterThan(200);
    });
});

function createTestPngWithMarkers(filePath: string) {
    const png = new PNG({ width: 100, height: 100 });

    // Fill with transparent
    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2;
            png.data[idx] = 0;
            png.data[idx + 1] = 0;
            png.data[idx + 2] = 0;
            png.data[idx + 3] = 0;
        }
    }

    function setPixel(x: number, y: number, r: number, g: number, b: number) {
        const idx = (png.width * y + x) << 2;
        png.data[idx] = r;
        png.data[idx + 1] = g;
        png.data[idx + 2] = b;
        png.data[idx + 3] = 255;
    }

    // Add marker colors
    setPixel(10, 10, 255, 165, 0); // Thruster (orange)
    setPixel(11, 10, 255, 0, 0);   // Orientation (red)
    setPixel(20, 20, 0, 255, 0);   // Laser (green)
    setPixel(21, 20, 255, 0, 0);   // Orientation (red)
    setPixel(30, 30, 0, 0, 255);   // Non-marker color (blue) - should be preserved
    setPixel(40, 40, 255, 255, 255); // Rocket (white)
    setPixel(50, 50, 0, 0, 0);     // Armor (black)

    const buffer = PNG.sync.write(png);
    fs.writeFileSync(filePath, buffer);
}
