import { test, expect } from '@playwright/test';
import { loginViaUI } from '../core/session';
import { DatabaseClient } from '../core/database';

test.describe('Loyalty Progression & Reward Redemption Workflow', () => {
  let db: DatabaseClient;

  test.beforeAll(async () => {
    db = new DatabaseClient();
    await db.connect();
  });

  test.beforeEach(async () => {
    await db.query('DELETE FROM reward_redemptions WHERE customer_id = 1 AND reward_name = "Free Soda"');
    await db.query('DELETE FROM visits WHERE customer_id = 1 AND amount NOT IN (25.50, 30.00)');
    await db.query('UPDATE loyalty_progress SET lifetime_visits = 2 WHERE customer_id = 1');
  });

  test.afterAll(async () => {
    await db.disconnect();
  });

  test('E2E Reward Unlock and Redemption', async ({ page }) => {
    // 1. Log in and verify initial state for customer Alice Spender (ID: 1)
    await loginViaUI(page, 'sentinel_owner', 'password123');
    await page.goto('/customers/1');
    await page.waitForLoadState('networkidle');

    // Alice initially has 2 visits (seeded), "Free Soda" needs 3. Verify Locked state.
    const sodaCard = page.locator('.p-5', { has: page.locator('h3', { hasText: 'Free Soda' }) }).first();
    await expect(sodaCard.getByText(/visits more/i)).toBeVisible();
    await expect(sodaCard.getByRole('button', { name: /redeem/i })).not.toBeVisible();

    // 2. Add a 3rd visit via the UI to unlock the reward
    await page.goto('/add-visit');
    await page.waitForLoadState('networkidle');
    await page.fill('#phone', '5550101000'); // Alice's phone number
    await page.waitForTimeout(500);
    await page.fill('#amount', '15.00');
    await page.click('button[type="submit"]');

    // Wait for save feedback
    await expect(page.locator('[role="status"]')).toBeVisible();

    // 3. Re-navigate to Alice's profile to verify progression
    await page.goto('/customers/1');
    await page.waitForLoadState('networkidle');

    // Verify visits counter increased to 3
    await expect(page.getByText('3 Lifetime Visits')).toBeVisible();

    // Verify "Free Soda" is now eligible
    await expect(sodaCard.getByRole('button', { name: /redeem now/i })).toBeVisible();

    // 4. Trigger redemption
    await sodaCard.getByRole('button', { name: /redeem now/i }).click();

    // Confirm Modal is visible
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/claim free soda/i);

    // Confirm Redemption
    await modal.getByRole('button', { name: /confirm redemption/i }).click();

    // Verify claimed status on card
    await expect(sodaCard.getByText(/claimed/i)).toBeVisible();

    // 5. Verify database redemption record
    const redemptions = await db.query('SELECT * FROM reward_redemptions WHERE customer_id = 1 AND reward_name = ?', ['Free Soda']);
    expect(redemptions.length).toBe(1);
    expect(redemptions[0].visits_threshold).toBe(3);
  });
});
