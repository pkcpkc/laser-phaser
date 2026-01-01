import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const SRC_DIR = 'src';
const TESTS_DIR = 'tests/unit';

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
        // Construct expected test file path
        // src/foo/bar.ts -> tests/foo/bar.test.ts
        // scripts/foo.ts -> tests/scripts/foo.test.ts
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
        const relPath = path.relative(TESTS_DIR, testFile);
        const srcRelPath = relPath.replace(/\.test\.ts$/, '.ts');

        let expectedSrcPath: string;
        if (srcRelPath.startsWith('scripts/')) {
            expectedSrcPath = srcRelPath;
        } else {
            expectedSrcPath = path.join(SRC_DIR, srcRelPath);
        }

        if (!fs.existsSync(expectedSrcPath) && !fs.existsSync(path.join(SRC_DIR, srcRelPath))) {
            // Double check if it might be in src even if it says scripts? No.
            // But simpler check:
            // If implicit src check failed, checking specific path.
        }

        // Re-simplifying logic for read-ability
        if (srcRelPath.startsWith('scripts' + path.sep)) {
            expectedSrcPath = srcRelPath;
        } else {
            expectedSrcPath = path.join(SRC_DIR, srcRelPath);
        }

        if (!fs.existsSync(expectedSrcPath)) {
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

checkTests().catch(console.error);
