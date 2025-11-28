import fs from 'fs';
import { PNG } from 'pngjs';
import { glob } from 'glob';
import { type ShipMarker, SHIPS_DIR, MarkerConfig } from './marker-config';

export async function processFile(filePath: string) {
    const markerPath = filePath.replace('.png', '.marker.json');

    if (fs.existsSync(markerPath)) {
        console.log(`Skipping ${filePath} (marker file exists)`);
        return;
    }

    console.log(`Processing ${filePath}...`);

    const data = fs.readFileSync(filePath);
    const png = PNG.sync.read(data);
    const markers: ShipMarker[] = [];

    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2;

            const type = MarkerConfig.getTypeIdx(idx, png);

            if (type && type !== 'orientation') {
                // Look for orientation pixel (red) in 3x3 area
                let angle = 0;

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

                // Normalize angle to 0-360 if needed, or keep as is. 
                // Math.atan2 returns -180 to 180.
                // Let's keep it consistent with Phaser rotation if possible, but degrees is fine.

                markers.push({ type, x, y, angle });
            }
        }
    }

    if (markers.length > 0) {
        fs.writeFileSync(markerPath, JSON.stringify(markers, null, 2));
        console.log(`Created ${markerPath} with ${markers.length} markers.`);
    } else {
        console.log(`No markers found in ${filePath}.`);
    }
}

async function main() {
    const files = await glob(`${SHIPS_DIR}/*.png`);
    if (files.length === 0) {
        console.log(`No .png files found in ${SHIPS_DIR}`);
        return;
    }

    for (const file of files) {
        await processFile(file);
    }
}

main().catch(console.error);
