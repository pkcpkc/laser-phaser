import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const SRC_DIR = 'src';
const TESTS_DIR = 'tests/unit';

const SRC_GEN_DIR = 'src-generated';

async function checkTests() {
    console.log('🔍 Checking test coverage...');

    // 1. Find all Source Files
    const srcFiles = await glob(`${SRC_DIR}/**/*.ts`, { ignore: ['**/*.d.ts'] });
    const scriptFiles = await glob('scripts/*.ts');

    // Combine src and scripts
    const allSrcFiles = [...srcFiles, ...scriptFiles];

    const testFiles = await glob(`${TESTS_DIR}/**/*.test.ts`);

    const missingTests: string[] = [];
    const orphanedTests: string[] = [];

    // 2. Check for Missing Tests
    for (const srcFile of allSrcFiles) {
        // Skip pure interface files
        if (isPureInterfaceFile(srcFile)) {
            continue;
        }

        // Construct expected test file path
        // src/foo/bar.ts -> tests/foo/bar.test.ts
        // scripts/foo.ts -> tests/scripts/foo.test.ts
        // src-generated/foo.ts -> tests/src-generated/foo.test.ts
        let relPath: string;
        if (srcFile.startsWith(SRC_DIR + path.sep)) {
            relPath = path.relative(SRC_DIR, srcFile);
        } else {
            relPath = srcFile;
        }

        const testRelPath = relPath.replace(/\.ts$/, '.test.ts');
        const expectedTestPath = path.join(TESTS_DIR, testRelPath);

        if (!fs.existsSync(expectedTestPath)) {
            missingTests.push(srcFile);
        }
    }

    // 3. Check for Orphaned Tests
    for (const testFile of testFiles) {
        // Construct expected source file path
        // tests/foo/bar.test.ts -> src/foo/bar.ts
        // tests/scripts/foo.test.ts -> scripts/foo.ts
        // tests/src-generated/foo.test.ts -> src-generated/foo.ts
        const relPath = path.relative(TESTS_DIR, testFile);
        const srcRelPath = relPath.replace(/\.test\.ts$/, '.ts');

        let expectedSrcPath: string;
        if (srcRelPath.startsWith('scripts' + path.sep) || srcRelPath.startsWith(SRC_GEN_DIR + path.sep)) {
            expectedSrcPath = srcRelPath;
        } else {
            expectedSrcPath = path.join(SRC_DIR, srcRelPath);
        }

        if (!fs.existsSync(expectedSrcPath)) {
            // Check if it's an orphaned test because the source is a pure interface
            // (which we now exclude from needing tests, so having a test is technicaly "orphaned"
            // relative to our "required tests" logic, but maybe we should allow it?
            // The user request was to "ignore pure interfaces files - where it does not make sense to enforce a test".

            // If the source file EXISTS but is ignored, we shouldn't flagging the test as orphaned strictly speaking,
            // OR we might want to say "hey you have a test for an interface file, do you need it?".

            // However, strictly speaking "orphaned" means the source file does NOT exist.
            // If the source file exists, it's not orphaned in the traditional sense.
            // But my logic below uses `expectedSrcPath` existence check.

            orphanedTests.push(testFile);
        }
    }

    // 4. Report Results
    let hasIssues = false;

    if (missingTests.length > 0) {
        console.log('\n❌ Missing Tests for the following files:');
        missingTests.forEach(f => console.log(`   - ${f}`));
        hasIssues = true;
    } else {
        console.log('\n✅ All source files have corresponding tests.');
    }

    if (orphanedTests.length > 0) {
        console.log('\n⚠️  Orphaned Tests found:');
        orphanedTests.forEach(f => console.log(`   - ${f}`));
        // Orphaned tests might not be checking a specific file (e.g. integration tests), 
        // effectively warning but maybe not an error, but user asked to detect them.
        hasIssues = true;
    } else {
        console.log('✅ No orphaned tests found.');
    }

    if (hasIssues) {
        process.exit(1);
    } else {
        console.log('\n✨ Test check passed!');
    }
}

/**
 * Checks if a file contains only interfaces or types and no runtime code.
 */
function isPureInterfaceFile(filePath: string): boolean {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Remove comments
        const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');

        // Check for runtime keywords
        // We look for 'class', 'function' (top level), 'const', 'let', 'var'
        // But we need to be careful. 'export interface' is fine. 'export type' is fine.
        // 'export const enum' is runtime? Enums ARE runtime objects in TS.

        // Simple heuristic: if it has 'class ', 'function ', 'const ', 'let ', 'var ', it has runtime code.
        // Note: 'export const' defines a value.
        // Note: 'import ...' is compile time mostly, but side-effects exist. We assume imports are for types if the rest is types.

        // Exclude strictly type-only keywords
        // If we find these, it is NOT a pure interface file:
        const runtimeKeywords = [
            /\bclass\s+/,
            /\bfunction\s+/,
            /\bconst\s+/,
            /\blet\s+/,
            /\bvar\s+/,
            /\bnew\s+/,
            // Enums are runtime objects in TypeScript unless const enums (which are erased but still can involve values)
            // But often enums are treated as data/types. 
            // For this specific user request "pure interfaces files", usually implies data structures.
            // Let's assume Enums might need tests if they have logic? No, enums are just definitions.
            // But let's verify if user considers enums "pure interface". Usually yes.
            // Let's stick to the main actionable blocks.
        ];

        for (const regex of runtimeKeywords) {
            if (regex.test(cleanContent)) {
                return false;
            }
        }

        return true;
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return false; // Assume it needs test if we can't read it
    }
}

checkTests().catch(console.error);
