import { test, expect } from '@playwright/test';
import { loginViaUI } from '../core/session';

test.describe('RBAC Verification Matrix', () => {

  test('STAFF role restrictions and redirects', async ({ page }) => {
    // 1. Log in as STAFF
    await loginViaUI(page, 'sentinel_staff', 'password123');
    
    // Staff should be redirected to /add-visit on login
    await expect(page).toHaveURL(/.*add-visit/);
    
    // 2. Verify redirect locks for other pages
    const restrictedPages = ['/', '/customers', '/visits', '/campaigns', '/settings', '/governance', '/loyalty', '/automations'];
    for (const path of restrictedPages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // Staff must be automatically redirected back to /add-visit
      await expect(page).toHaveURL(/.*add-visit/);
    }
  });

  test('MANAGER role restrictions and redirects', async ({ page }) => {
    // 1. Log in as MANAGER
    await loginViaUI(page, 'sentinel_manager', 'password123');
    
    // Manager should land on the home dashboard
    await expect(page).toHaveURL(/\/$/);
    
    // 2. Access allowed sections
    const allowedPages = ['/customers', '/visits', '/campaigns', '/loyalty', '/automations', '/governance'];
    for (const path of allowedPages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp('.*' + path.replace('/', '')));
    }
    
    // 3. Attempt settings - should redirect to dashboard (/)
    const restricted = ['/settings'];
    for (const path of restricted) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/$/);
    }

    // 4. Verify specific tab gating on /governance
    await page.goto('/governance');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Audit Log')).not.toBeVisible();
    await expect(page.getByText('System Events')).toBeVisible();

    // Verify backend block for audit logs
    const auditStatus = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/governance/audit');
        return res.status;
      } catch {
        return 999;
      }
    });
    expect(auditStatus).toBe(403);
  });

  test('OWNER role full access permissions', async ({ page }) => {
    // 1. Log in as OWNER
    await loginViaUI(page, 'sentinel_owner', 'password123');
    
    // Owner lands on home dashboard
    await expect(page).toHaveURL(/\/$/);
    
    // 2. Owner should have access to ALL administrative panels
    const adminPages = ['/settings', '/governance', '/customers', '/visits', '/campaigns', '/loyalty', '/automations'];
    for (const path of adminPages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp('.*' + path.replace('/', '')));
    }
  });
});
