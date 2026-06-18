import { test, expect } from '@playwright/test';
import { loginViaUI } from '../core/session';
import { DatabaseClient } from '../core/database';
import { execSync } from 'child_process';
import * as path from 'path';

test.describe('Campaign Management & ROI Workflow', () => {
  let db: DatabaseClient;

  test.beforeAll(async () => {
    db = new DatabaseClient();
    await db.connect();
  });

  test.beforeEach(async () => {
    // Re-seed DB to a clean state for campaigns
    await db.query('DELETE FROM campaigns');
    await db.query('DELETE FROM messages');
    await db.query('DELETE FROM campaign_summaries');
    await db.query('DELETE FROM messages WHERE message_text LIKE "%SENTINEL20%"');
    await db.query('DELETE FROM visits WHERE customer_id = 1 AND amount = 50.00');
    await db.query('DELETE FROM campaign_summaries WHERE restaurant_id = 1');
  });

  test.afterAll(async () => {
    await db.disconnect();
  });

  test('E2E Campaign Dispatch, Duplicate Protection, and ROI Computation', async ({ page }) => {
    await loginViaUI(page, 'sentinel_owner', 'password123');
    
    // 1. Navigate to Campaigns
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    const uniqueId = Math.random().toString(36).substring(7);
    const campaignMsg = `Promo: Special 20% off tonight at Sentinel Diner! Code: SENTINEL20_${uniqueId}`;
    
    // Fill text area
    await page.fill('textarea', campaignMsg);
    
    // Select audience dropdown (All Customers)
    await page.locator('button:has-text("All")').click();

    // Click Send Campaign (opens confirmation modal)
    await page.click('button:has-text("Launch Campaign")');

    // Confirm inside modal
    await page.click('button:has-text("Yes, Launch Campaign")');

    // Verify success banner/alert
    const feedback = page.locator('text=Campaign launched successfully').first();
    await expect(feedback).toBeVisible();

    // 2. Verify duplicate prevention (should error with 409 or alert)
    // Attempt sending again immediately
    await page.fill('textarea', campaignMsg);
    await page.click('button:has-text("Launch Campaign")');
    await page.click('button:has-text("Yes, Launch Campaign")');

    // Verify duplicate error alert
    await expect(page.locator('text=Duplicate campaign request detected')).toBeVisible();

    // 3. Verify in database that messages are created
    // Customer Alice Spender (phone 5550101000) is in Restaurant 1. 
    // She should have received a message with the campaign text.
    const messages = await db.query('SELECT * FROM messages WHERE message_text LIKE ?', [`%SENTINEL20%`]);
    expect(messages.length).toBeGreaterThan(0);
    const msg = messages[0];
    expect(msg.status).toBe('sent');

    // 4. Force a visit for targeted customer to verify conversion
    // Alice visits and spends $50.00
    await page.goto('/add-visit');
    await page.waitForLoadState('networkidle');
    await page.fill('#phone', '5550101000');
    await page.waitForTimeout(500);
    await page.fill('#amount', '50.00');
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="status"]')).toBeVisible();

    // 5. Execute system job to compute ROI metrics
    // We execute run_system_job.py daily_intelligence using child_process
    const seederScript = path.resolve(__dirname, '../fixtures/run_system_job.py');
    const pythonBin = path.resolve(__dirname, '../../backend/.venv/bin/python3');
    execSync(`"${pythonBin}" "${seederScript}" daily_intelligence`, { 
      env: { 
        ...process.env, 
        DATABASE_URL: process.env.DATABASE_URL || 'sqlite:///' + path.resolve(__dirname, '../../sentinel_test.db')
      } 
    });

    // 6. Verify Campaign ROI summary is generated
    const summaries = await db.query('SELECT * FROM campaign_summaries WHERE restaurant_id = 1');
    expect(summaries.length).toBeGreaterThan(0);
    const summary = summaries[0];
    expect(summary.total_sent).toBeGreaterThan(0);
    expect(summary.total_converted).toBeGreaterThan(0);
    expect(parseFloat(summary.revenue_attributed)).toBeGreaterThan(0);
  });
});
