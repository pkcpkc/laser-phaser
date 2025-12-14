
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { processFile } from '../../scripts/generate-markers';


const TEST_DIR = 'tests/temp/ships';
const TEST_FILE = 'test_ship_vitest.png';
const TEST_MARKER_FILE = 'test_ship_vitest.markers.ts';
const TEST_PATH = path.join(TEST_DIR, TEST_FILE);
const MARKER_PATH = path.join('src/generated', TEST_MARKER_FILE);

describe('Marker Generator', () => {
    beforeAll(() => {
        if (!fs.existsSync(TEST_DIR)) {
            fs.mkdirSync(TEST_DIR, { recursive: true });
        }
        if (!fs.existsSync('src/generated')) {
            fs.mkdirSync('src/generated', { recursive: true });
        }
        createTestPng(TEST_PATH);
    });

    afterAll(() => {
        if (fs.existsSync(TEST_PATH)) fs.unlinkSync(TEST_PATH);
        if (fs.existsSync(MARKER_PATH)) fs.unlinkSync(MARKER_PATH);
    });

    it('should generate correct markers from PNG', async () => {
        // Ensure marker file doesn't exist before test
        if (fs.existsSync(MARKER_PATH)) fs.unlinkSync(MARKER_PATH);

        await processFile(TEST_PATH);

        expect(fs.existsSync(MARKER_PATH)).toBe(true);

        const content = fs.readFileSync(MARKER_PATH, 'utf-8');
        // Extract JSON from TS file
        const jsonMatch = content.match(/export const markers: ShipMarker\[] = (\[[\s\S]*]);/);
        if (!jsonMatch) throw new Error('Could not find markers array in generated file');
        const markers = JSON.parse(jsonMatch[1]);

        expect(markers).toHaveLength(4);

        // Check specific markers
        const thruster = markers.find((m: any) => m.type === 'thruster');
        expect(thruster).toBeDefined();
        expect(thruster.x).toBe(10);
        expect(thruster.y).toBe(10);
        expect(thruster.angle).toBe(0);

        const laser = markers.find((m: any) => m.type === 'laser');
        expect(laser).toBeDefined();
        expect(laser.x).toBe(50);
        expect(laser.y).toBe(50);
        expect(laser.angle).toBe(90);

        const rocket = markers.find((m: any) => m.type === 'rocket');
        expect(rocket).toBeDefined();
        expect(rocket.x).toBe(20);
        expect(rocket.y).toBe(80);
        expect(rocket.angle).toBe(-90);

        const armor = markers.find((m: any) => m.type === 'armor');
        expect(armor).toBeDefined();
        expect(armor.x).toBe(80);
        expect(armor.y).toBe(80);
        expect(armor.angle).toBe(180);
    });
});

function createTestPng(filePath: string) {
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

    // Helper to set pixel
    function setPixel(x: number, y: number, r: number, g: number, b: number) {
        const idx = (png.width * y + x) << 2;
        png.data[idx] = r;
        png.data[idx + 1] = g;
        png.data[idx + 2] = b;
        png.data[idx + 3] = 255;
    }

    // Thruster (Orange) at 10, 10
    setPixel(10, 10, 255, 165, 0);
    // Orientation (Red) at 11, 10 (Right -> 0 degrees)
    setPixel(11, 10, 255, 0, 0);

    // Laser (Green) at 50, 50
    setPixel(50, 50, 0, 255, 0);
    // Orientation (Red) at 50, 51 (Down -> 90 degrees)
    setPixel(50, 51, 255, 0, 0);

    // Armor (Black) at 80, 80
    setPixel(80, 80, 0, 0, 0);
    // Orientation (Red) at 79, 80 (Left -> 180 degrees)
    setPixel(79, 80, 255, 0, 0);

    // Rocket (White) at 20, 80
    setPixel(20, 80, 255, 255, 255);
    // Orientation (Red) at 20, 79 (Up -> -90 degrees)
    setPixel(20, 79, 255, 0, 0);

    const buffer = PNG.sync.write(png);
    fs.writeFileSync(filePath, buffer);
}
