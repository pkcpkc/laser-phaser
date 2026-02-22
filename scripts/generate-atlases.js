import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import packer from 'free-tex-packer-core';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../res');
const outputDir = path.join(__dirname, '../public/assets');
const imagesDir = path.join(outputDir, 'images');
const spritesDir = path.join(outputDir, 'sprites');

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

            // Special handling for backgrounds: copy directly, do not pack
            if (dir === 'backgrounds') {
                console.log(`Skipping atlas generation for ${dir}, copying files directly...`);
                // Ensure the images directory exists
                if (!fs.existsSync(imagesDir)) {
                    fs.mkdirSync(imagesDir, { recursive: true });
                }
                for (const file of imageFiles) {
                    const srcPath = path.join(sourceDir, file);
                    const destPath = path.join(imagesDir, file);
                    fs.copyFileSync(srcPath, destPath);
                    console.log(`Copied ${file} to ${imagesDir}`);
                }
                continue;
            }

            // Directories that must fit in a single atlas page (no multi-page splitting)
            const singlePageDirs = ['merchants'];
            const isSinglePage = singlePageDirs.includes(dir);

            const files = imageFiles.map(file => {
                return {
                    path: file,
                    contents: fs.readFileSync(path.join(sourceDir, file))
                };
            });

            const options = {
                textureName: dir,
                width: isSinglePage ? 4096 : 2048,
                height: isSinglePage ? 4096 : 2048,
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
                // Ensure the sprites directory exists
                if (!fs.existsSync(spritesDir)) {
                    fs.mkdirSync(spritesDir, { recursive: true });
                }
                packer(files, options, (files, error) => {
                    if (error) {
                        console.error('Packing error:', error);
                    } else {
                        for (const item of files) {
                            const outFile = path.join(spritesDir, item.name);
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
