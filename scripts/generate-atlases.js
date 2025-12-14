import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import packer from 'free-tex-packer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../res');
const outputDir = path.join(__dirname, '../public/assets');

async function generateAtlases() {
    try {
        const items = fs.readdirSync(inputDir, { withFileTypes: true });
        const dirs = items.filter(item => item.isDirectory()).map(item => item.name);

        for (const dir of dirs) {
            console.log(`Processing ${dir}...`);
            const sourceDir = path.join(inputDir, dir);

            // Gather all images in the source directory
            const imageFiles = fs.readdirSync(sourceDir).filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.png', '.jpg', '.jpeg'].includes(ext);
            });

            if (imageFiles.length === 0) {
                console.log(`No images found in ${dir}, skipping.`);
                continue;
            }

            const files = imageFiles.map(file => {
                return {
                    path: file,
                    contents: fs.readFileSync(path.join(sourceDir, file))
                };
            });

            const options = {
                textureName: dir,
                width: 2048,
                height: 2048,
                fixedSize: false,
                padding: 2,
                allowRotation: false,
                detectIdentical: true,
                allowTrim: true,
                exporter: 'Phaser3',
                removeFileExtension: true,
                prependFolderName: false,
                appInfo: { displayName: "Laser Phaser" } // prevents "Created with Free Texture Packer" spam in warnings if picky
            };

            try {
                packer(files, options, (files, error) => {
                    if (error) {
                        console.error('Packing error:', error);
                    } else {
                        for (const item of files) {
                            const outFile = path.join(outputDir, item.name);
                            fs.writeFileSync(outFile, item.buffer);
                            console.log(`Saved ${outFile}`);
                        }
                    }
                });
            } catch (err) {
                console.error(`Error processing ${dir}:`, err);
            }
        }
        console.log('Atlas generation complete.');
    } catch (err) {
        console.error('Error listing directories:', err);
    }
}

generateAtlases();
