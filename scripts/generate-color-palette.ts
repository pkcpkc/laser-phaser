
import fs from 'fs';
import { PNG } from 'pngjs';
import { MarkerConfig } from './marker-config';

// --- Configuration ---
const BLOCK_SIZE = 48;
const PADDING = 10;
const ROW_SPACING = 20;
const TEXT_OFFSET_X = 10; // Distance between color block and text
const FONT_HEIGHT = 5;
const SCALE = 3;
const CHAR_SPACING = 2 * SCALE;
const OUTPUT_PATH = 'module-colors.png';

// --- Font Data (4x5 default, variable width supported) ---
const FONT: Record<string, number[]> = {
    'A': [0x6, 0x9, 0xF, 0x9, 0x9],
    'B': [0xE, 0x9, 0xE, 0x9, 0xE],
    'C': [0x6, 0x9, 0x8, 0x9, 0x6],
    'D': [0xE, 0x9, 0x9, 0x9, 0xE],
    'E': [0xF, 0x8, 0xE, 0x8, 0xF],
    'F': [0xF, 0x8, 0xE, 0x8, 0x8],
    'G': [0x6, 0x9, 0xB, 0x9, 0x6],
    'H': [0x9, 0x9, 0xF, 0x9, 0x9],
    'I': [0xE, 0x4, 0x4, 0x4, 0xE],
    'J': [0x7, 0x2, 0x2, 0xA, 0x4],
    'K': [0x9, 0xA, 0xC, 0xA, 0x9],
    'L': [0x8, 0x8, 0x8, 0x8, 0xF],
    'M': [0x11, 0x1B, 0x15, 0x11, 0x11],
    'N': [0x9, 0xD, 0xF, 0xB, 0x9],
    'O': [0x6, 0x9, 0x9, 0x9, 0x6],
    'P': [0xE, 0x9, 0xE, 0x8, 0x8],
    'Q': [0x6, 0x9, 0x9, 0xA, 0xD],
    'R': [0xE, 0x9, 0xE, 0xA, 0x9],
    'S': [0x7, 0x8, 0x6, 0x1, 0xE],
    'T': [0xF, 0x4, 0x4, 0x4, 0x4],
    'U': [0x9, 0x9, 0x9, 0x9, 0x6],
    'V': [0x9, 0x9, 0x9, 0xA, 0x4],
    'W': [0x11, 0x11, 0x15, 0x1B, 0x11],
    'X': [0x9, 0x9, 0x6, 0x9, 0x9],
    'Y': [0x9, 0x9, 0x6, 0x1, 0x1],
    'Z': [0xF, 0x1, 0x2, 0x4, 0xF]
};

// --- Helpers ---

function drawPixel(png: PNG, x: number, y: number, color: [number, number, number]) {
    if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;
    const idx = (png.width * y + x) << 2;
    png.data[idx] = color[0];
    png.data[idx + 1] = color[1];
    png.data[idx + 2] = color[2];
    png.data[idx + 3] = 255;
}

function drawRect(png: PNG, startX: number, startY: number, width: number, height: number, r: number, g: number, b: number, a: number) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const px = startX + x;
            const py = startY + y;
            if (px < png.width && py < png.height) {
                const idx = (png.width * py + px) << 2;
                png.data[idx] = r;
                png.data[idx + 1] = g;
                png.data[idx + 2] = b;
                png.data[idx + 3] = a;
            }
        }
    }
}

function drawChar(png: PNG, char: string, startX: number, startY: number, color: [number, number, number]): number {
    const bitmap = FONT[char];
    if (!bitmap) return 0;

    let width = 4;
    // Heuristic: check if any row requires more than 4 bits (0xF = 1111)
    if (bitmap.some(row => row > 0xF)) width = 5;

    for (let y = 0; y < FONT_HEIGHT; y++) {
        const row = bitmap[y];
        for (let x = 0; x < width; x++) {
            // Read bits from right to left (LSB at right)? 
            // Previous logic: (row >> (width - 1 - x)) & 1 implies MSB at x=0
            if ((row >> (width - 1 - x)) & 1) {
                // Draw scaled pixel
                for (let sy = 0; sy < SCALE; sy++) {
                    for (let sx = 0; sx < SCALE; sx++) {
                        drawPixel(png, startX + x * SCALE + sx, startY + y * SCALE + sy, color);
                    }
                }
            }
        }
    }
    return width * SCALE;
}

function drawText(png: PNG, text: string, x: number, y: number) {
    let cursorX = x;
    for (const char of text.toUpperCase()) {
        const w = drawChar(png, char, cursorX, y, [255, 255, 255]);
        cursorX += w + CHAR_SPACING;
    }
}

// --- Main Execution ---

function main() {
    const colors = MarkerConfig.colors;
    const keys = Object.keys(colors) as Array<keyof typeof colors>;

    const width = BLOCK_SIZE + PADDING * 2 + TEXT_OFFSET_X + 200; // Estimated width needed
    const height = PADDING * 2 + (keys.length * BLOCK_SIZE) + ((keys.length - 1) * ROW_SPACING);

    const png = new PNG({ width, height });

    // Fill background with dark gray
    drawRect(png, 0, 0, width, height, 40, 40, 40, 255);

    keys.forEach((key, index) => {
        const hex = colors[key];
        const r = (hex >>> 24) & 0xFF;
        const g = (hex >>> 16) & 0xFF;
        const b = (hex >>> 8) & 0xFF;
        const a = hex & 0xFF;

        const startX = PADDING;
        const startY = PADDING + index * (BLOCK_SIZE + ROW_SPACING);

        // Draw Color Block
        drawRect(png, startX, startY, BLOCK_SIZE, BLOCK_SIZE, r, g, b, a);

        // Draw Label
        const textHeight = FONT_HEIGHT * SCALE;
        const textY = Math.floor(startY + (BLOCK_SIZE - textHeight) / 2);
        const textX = startX + BLOCK_SIZE + TEXT_OFFSET_X;

        drawText(png, key, textX, textY);
    });

    png.pack().pipe(fs.createWriteStream(OUTPUT_PATH));
    console.log(`Successfully generated ${OUTPUT_PATH}`);
}

main();
