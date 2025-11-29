import fs from 'fs';
import { PNG } from 'pngjs';
import { glob } from 'glob';
import { DEST_SHIPS_DIR, MarkerConfig } from './marker-config';

export function cleanupMarkers(inputPath: string, outputPath?: string) {
    const data = fs.readFileSync(inputPath);
    const png = PNG.sync.read(data);

    MarkerConfig.removeAllMarkers(png);

    const buffer = PNG.sync.write(png);
    const targetPath = outputPath || inputPath;
    fs.writeFileSync(targetPath, buffer);
    console.log(`Cleaned markers from ${targetPath}`);
}

async function main() {
    // Check if a specific file path was provided as a command-line argument
    const targetPath = process.argv[2];

    if (targetPath) {
        // Clean up a specific file
        if (!fs.existsSync(targetPath)) {
            console.error(`Error: File not found: ${targetPath}`);
            process.exit(1);
        }

        try {
            cleanupMarkers(targetPath);
            console.log(`\nCleaned up 1 file: ${targetPath}`);
        } catch (err) {
            console.error(`Error cleaning ${targetPath}:`, err);
            process.exit(1);
        }
    } else {
        // Clean up all PNG files in DEST_SHIPS_DIR
        const files = await glob(`${DEST_SHIPS_DIR}/*.png`);

        if (files.length === 0) {
            console.log(`No .png files found in ${DEST_SHIPS_DIR}`);
            return;
        }

        let count = 0;
        for (const file of files) {
            try {
                cleanupMarkers(file);
                count++;
            } catch (err) {
                console.error(`Error cleaning ${file}:`, err);
            }
        }

        console.log(`\nCleaned up ${count} files in ${DEST_SHIPS_DIR}`);
    }
}

main().catch(console.error);
