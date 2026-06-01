import { test, expect } from '@playwright/test';
import { loginViaUI } from '../core/session';

// Disable transitions and animations during screenshots to avoid animation-related diffs
async function disableAnimations(page: any) {
  try {
    // Wait for the body element to be attached to ensure DOM is ready for style injection
    await page.waitForSelector('body', { state: 'attached', timeout: 5000 });
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          transition-property: none !important;
          transform: none !important;
          animation: none !important;
          transition-duration: 0s !important;
          animation-duration: 0s !important;
        }
      `,
    });
  } catch (e) {
    console.warn('Warning: Could not disable animations:', e);
  }
}

test.describe('Visual Regression Matrix', () => {

  test('Capture and verify login page visual state', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);

    // Light Mode
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('login-light.png', { maxDiffPixelRatio: 0.05 });

    // Dark Mode
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('login-dark.png', { maxDiffPixelRatio: 0.05 });
  });

  test.describe('Authenticated viewports layouts check', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, 'sentinel_owner', 'password123');
      await expect(page).toHaveURL(/\/$/);
      await disableAnimations(page);
    });

    const targetPages = [
      { name: 'dashboard', url: '/' },
      { name: 'customers', url: '/customers' },
      { name: 'customer-detail', url: '/customers/1' },
      { name: 'visits', url: '/visits' },
      { name: 'loyalty', url: '/loyalty' },
      { name: 'automations', url: '/automations' },
      { name: 'governance', url: '/governance' }
    ];

    for (const p of targetPages) {
      test(`Verify visual layout for: ${p.name}`, async ({ page }) => {
        await page.goto(p.url);
        await page.waitForLoadState('networkidle');
        await disableAnimations(page);

        // 1. Light Mode Layout check
        await page.evaluate(() => document.documentElement.classList.remove('dark'));
        await page.waitForTimeout(300);
        await expect(page).toHaveScreenshot(`${p.name}-light.png`, { maxDiffPixelRatio: 0.05 });

        // 2. Dark Mode Layout check
        await page.evaluate(() => document.documentElement.classList.add('dark'));
        await page.waitForTimeout(300);
        await expect(page).toHaveScreenshot(`${p.name}-dark.png`, { maxDiffPixelRatio: 0.05 });
      });
    }
  });
});
