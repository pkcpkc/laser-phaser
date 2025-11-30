import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { glob } from 'glob';
import { MarkerConfig, type ShipMarker } from './marker-config';

const SOURCE_SHIPS_DIR = 'public/res/ships';
const DEST_SHIPS_DIR = 'public/res/ships';

export async function processFile(sourcePath: string) {
    const fileName = path.basename(sourcePath);
    const destPath = path.join(DEST_SHIPS_DIR, fileName);
    const markerPath = destPath.replace('.png', '.marker.json');

    // Only copy if source and destination are different
    if (path.resolve(sourcePath) !== path.resolve(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied ${fileName} to ${DEST_SHIPS_DIR}`);
    }

    if (fs.existsSync(markerPath)) {
        console.log(`Skipping marker generation for ${fileName} (marker file exists)`);
        return;
    }

    console.log(`Generating markers for ${fileName}...`);

    const data = fs.readFileSync(destPath);
    const png = PNG.sync.read(data);
    const markers: ShipMarker[] = [];

    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2;

            const type = MarkerConfig.getTypeIdx(idx, png);

            if (type && type !== 'orientation') {
                // Look for orientation pixel (red) in 3x3 area
                let angle: number | null = null;

                // Search 3x3 area centered on marker
                outer: for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;

                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < png.width && ny >= 0 && ny < png.height) {
                            const nIdx = (png.width * ny + nx) << 2;
                            const nr = png.data[nIdx];
                            const ng = png.data[nIdx + 1];
                            const nb = png.data[nIdx + 2];

                            if (nr === 255 && ng === 0 && nb === 0) {
                                angle = Math.atan2(dy, dx) * (180 / Math.PI);
                                break outer;
                            }
                        }
                    }
                }

                // Only create marker if BOTH conditions are met:
                // 1. Marker color identified (already checked above)
                // 2. Orientation marker found in 3x3 area
                if (angle !== null) {
                    markers.push({ type, x, y, angle });
                }
            }
        }
    }

    if (markers.length > 0) {
        fs.writeFileSync(markerPath, JSON.stringify(markers, null, 2));
        console.log(`Created ${markerPath} with ${markers.length} markers.`);
    } else {
        console.log(`No markers found in ${fileName}.`);
    }
}

async function main() {
    // Ensure destination directory exists
    if (!fs.existsSync(DEST_SHIPS_DIR)) {
        fs.mkdirSync(DEST_SHIPS_DIR, { recursive: true });
        console.log(`Created directory ${DEST_SHIPS_DIR}`);
    }

    const files = await glob(`${SOURCE_SHIPS_DIR}/*.png`);
    if (files.length === 0) {
        console.log(`No .png files found in ${SOURCE_SHIPS_DIR}`);
        return;
    }

    for (const file of files) {
        await processFile(file);
    }
}

main().catch(console.error);
