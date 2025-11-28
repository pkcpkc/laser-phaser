
import fs from 'fs';
import { PNG } from 'pngjs';
import { glob } from 'glob';
import { SHIPS_DIR, MarkerConfig } from './marker-config';


/**
 * Find a similar color that is not a marker color (hex only)
 * Slightly adjust the color values to avoid exact marker matches
 */

export function cleanupMarkers(inputPath: string, outputPath?: string): void {
    const output = outputPath || inputPath.replace('.png', '_clean.png');

    console.log(`Cleaning markers from ${inputPath}...`);

    const data = fs.readFileSync(inputPath);
    const png = PNG.sync.read(data);

    let replacedCount = 0;

    

    const buffer = PNG.sync.write(png);
    fs.writeFileSync(output, buffer);

    console.log(`Cleaned ${replacedCount} marker pixels. Saved to ${output}`);
}

async function main() {
    const files = await glob(`${SHIPS_DIR}/*.png`);

    if (files.length === 0) {
        console.log(`No .png files found in ${SHIPS_DIR}`);
        return;
    }

    for (const file of files) {
        // Skip already cleaned files
        if (file.includes('_clean.png')) continue;

        cleanupMarkers(file);
    }
}

main().catch(console.error);
