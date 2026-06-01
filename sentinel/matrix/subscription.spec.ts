import { test, expect, Page } from '@playwright/test';
import { loginViaUI } from '../core/session';

async function setPlan(page: Page, planName: string) {
  const success = await page.evaluate(async (plan) => {
    try {
      const res = await fetch('/api/auth/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan_name: plan }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }, planName);
  
  if (!success) {
    throw new Error(`Failed to change plan to ${planName}`);
  }
  
  // Reload page to re-trigger checkAuth and fetch fresh feature permissions
  await page.reload();
  await page.waitForLoadState('networkidle');
}

test.describe('Subscription Feature Gating Matrix', () => {

  test.beforeEach(async ({ page }) => {
    // Owner is required to update subscriptions
    await loginViaUI(page, 'sentinel_owner', 'password123');
    await expect(page).toHaveURL(/\/$/);
  });

  test('STARTER Plan gates premium features', async ({ page }) => {
    await setPlan(page, 'STARTER');

    // 1. Loyalty page should show Lock UI
    await page.goto('/loyalty');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.container-app svg.lucide-lock')).toBeVisible();
    await expect(page.getByText(/upgrade/i).or(page.getByText(/feature/i)).first()).toBeVisible();

    // 2. Campaigns page should show Lock UI
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.container-app svg.lucide-lock')).toBeVisible();

    // 3. Automations page should show Lock UI
    await page.goto('/automations');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.container-app svg.lucide-lock')).toBeVisible();

    // 4. Governance page should show Lock UI
    await page.goto('/governance');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.container-app svg.lucide-lock')).toBeVisible();

    // 5. Dashboard features should render Lock indicators
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Tab list controls for Intelligence and Growth should show Lock
    await expect(page.getByRole('button', { name: /intelligence/i }).locator('svg.lucide-lock')).toBeVisible();
    await expect(page.getByRole('button', { name: /growth/i }).locator('svg.lucide-lock')).toBeVisible();
  });

  test('GROWTH Plan unlocks Loyalty & Campaigns, but gates Pro features', async ({ page }) => {
    await setPlan(page, 'GROWTH');

    // 1. Loyalty page should be UNLOCKED (no global Lock screen)
    await page.goto('/loyalty');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.container-app svg.lucide-lock')).not.toBeVisible();
    await expect(page.locator('h1', { hasText: /Loyalty Rewards/i })).toBeVisible();

    // 2. Campaigns page should be UNLOCKED
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.container-app svg.lucide-lock')).not.toBeVisible();
    await expect(page.locator('h1', { hasText: /Campaigns/i })).toBeVisible();

    // 3. Automations page remains LOCKED
    await page.goto('/automations');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.container-app svg.lucide-lock')).toBeVisible();

    // 4. Governance page remains LOCKED
    await page.goto('/governance');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.container-app svg.lucide-lock')).toBeVisible();
  });

  test('PRO Plan unlocks all capabilities', async ({ page }) => {
    await setPlan(page, 'PRO');

    // All administrative views should render without any Lock icons
    const views = ['/loyalty', '/campaigns', '/automations', '/governance'];
    for (const view of views) {
      await page.goto(view);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.container-app svg.lucide-lock')).not.toBeVisible();
    }
  });
});
