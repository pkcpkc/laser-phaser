
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function fixImports() {
    const srcDir = 'src';
    const files = await glob(`${srcDir}/**/*.ts`);

    for (const file of files) {
        let content = fs.readFileSync(file, 'utf-8');
        let changed = false;

        // 1. Fix broken /definitions/ imports (from older migration step)
        if (content.includes('/definitions/')) {
            const newContent = content.replace(/\/definitions\//g, '/hulls/');
            if (newContent !== content) {
                content = newContent;
                changed = true;
            }
        }

        // 2. Fix -def suffixes (from older migration step)
        if (content.includes('-def\'') || content.includes('-def"')) {
            const newContent = content.replace(/-def/g, '');
            if (newContent !== content) {
                content = newContent;
                changed = true;
            }
        }

        // 3. Fix direct ship imports (files moved from src/ships/ to src/ships/hulls/)
        const ships = [
            'big-cruiser',
            'blood-bomber',
            'blood-fighter',
            'blood-hunter',
            'green-rocket-carrier'
        ];

        for (const ship of ships) {
            // Regex: Look for quote, then path ending in /ships/${ship} followed by quote
            // Matches: import ... from "../ships/big-cruiser"
            // Does NOT match: import ... from "../ships/hulls/big-cruiser"

            const regex = new RegExp(`(['"])(.*\\/)?ships\\/${ship}(['"])`, 'g');

            if (regex.test(content)) {
                const newContent = content.replace(regex, (match, quote1, pathPrefix, quote2) => {
                    const prefix = pathPrefix || '';
                    if (prefix.includes('hulls')) return match; // Already fixed
                    return `${quote1}${prefix}ships/hulls/${ship}${quote2}`;
                });

                if (newContent !== content) {
                    content = newContent;
                    changed = true;
                }
            }
        }

        if (changed) {
            console.log(`Updating imports in ${file}`);
            fs.writeFileSync(file, content);
        }
    }
}

fixImports();
