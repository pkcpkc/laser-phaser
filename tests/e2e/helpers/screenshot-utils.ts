import type { Page, TestInfo } from '@playwright/test';
import path from 'path';

/**
 * Takes a screenshot and saves it to a consistent path based on the test file location.
 * Path: tests/reports/screenshots/<relative-path-from-e2e-root>/<imageName>
 */
export async function takeScreenshot(page: Page, testInfo: TestInfo, imageName: string) {
    // testInfo.file is absolute path to the spec file
    // testInfo.project.testDir is absolute path to the configured testDir (tests/e2e)
    const relativePath = path.relative(testInfo.project.testDir, testInfo.file);
    const screenshotPath = path.join('test-reports/screenshots', relativePath, imageName);

    await page.screenshot({ path: screenshotPath });
}
