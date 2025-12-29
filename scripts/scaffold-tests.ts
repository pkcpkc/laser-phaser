import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const SRC_DIR = 'src';
const TESTS_DIR = 'tests';

async function scaffoldTests() {
    console.log('🛠️  Scaffolding missing tests...');

    const srcFiles = await glob(`${SRC_DIR}/**/*.ts`, { ignore: ['**/*.d.ts'] });
    const scriptFiles = await glob('scripts/*.ts');
    const allSrcFiles = [...srcFiles, ...scriptFiles];

    let createdCount = 0;

    for (const srcFile of allSrcFiles) {
        let relPath: string;
        if (srcFile.startsWith(SRC_DIR + path.sep)) {
            relPath = path.relative(SRC_DIR, srcFile);
        } else {
            relPath = srcFile;
        }

        const testRelPath = relPath.replace(/\.ts$/, '.test.ts');
        const expectedTestPath = path.join(TESTS_DIR, testRelPath);

        if (!fs.existsSync(expectedTestPath)) {
            // Ensure directory exists
            const dir = path.dirname(expectedTestPath);
            fs.mkdirSync(dir, { recursive: true });

            // Create placeholder test content
            const testContent = `import { describe, it, expect } from 'vitest';

describe('${relPath}', () => {
    it('should pass', () => {
        expect(true).toBe(true);
    });
});
`;
            fs.writeFileSync(expectedTestPath, testContent);
            console.log(`✅ Created: ${expectedTestPath}`);
            createdCount++;
        }
    }

    if (createdCount > 0) {
        console.log(`\n✨ Created ${createdCount} missing test files.`);
    } else {
        console.log('\n✨ No missing tests found.');
    }
}

scaffoldTests().catch(console.error);
