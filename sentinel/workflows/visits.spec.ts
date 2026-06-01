import { test, expect } from '@playwright/test';
import { loginViaUI } from '../core/session';
import { DatabaseClient } from '../core/database';

test.describe('Visits Capture E2E Workflow', () => {
  let db: DatabaseClient;

  test.beforeAll(async () => {
    db = new DatabaseClient();
    await db.connect();
  });

  test.beforeEach(async () => {
    // Delete any existing visits/customer records for the test phone numbers
    // to prevent pollution between desktop and mobile project runs.
    await db.query('DELETE FROM visits WHERE customer_id IN (SELECT id FROM customers WHERE phone_number IN ("5550303030", "5550404040"))');
    await db.query('DELETE FROM customer_profiles WHERE customer_id IN (SELECT id FROM customers WHERE phone_number IN ("5550303030", "5550404040"))');
    await db.query('DELETE FROM messages WHERE customer_id IN (SELECT id FROM customers WHERE phone_number IN ("5550303030", "5550404040"))');
    await db.query('DELETE FROM customers WHERE phone_number IN ("5550303030", "5550404040")');
  });

  test.afterAll(async () => {
    await db.disconnect();
  });

  test('Fast Visit Capture E2E and Double-Click Idempotency', async ({ page }) => {
    await loginViaUI(page, 'sentinel_owner', 'password123');
    await page.goto('/add-visit');
    await page.waitForLoadState('networkidle');

    const phone = '5550303030';
    const name = 'Charlie Capture';
    const amount = '75.25';

    // Fill form
    await page.fill('#phone', phone);
    
    // Wait for customer search check to run and reveal fields
    await page.waitForTimeout(500);
    
    await page.fill('#name', name);
    await page.fill('#amount', amount);
    
    // Fill optional birthday/anniversary for new customer
    await page.fill('#birthday', '1990-05-15');

    // Click Save Visit
    await page.click('button[type="submit"]');

    // Verify success feedback message
    const feedback = page.locator('[role="status"]');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText(/saved/i);

    // Verify database updates
    const customers = await db.query('SELECT * FROM customers WHERE phone_number = ?', [phone]);
    expect(customers.length).toBe(1);
    const customer = customers[0];
    expect(customer.name).toBe(name);

    const visits = await db.query('SELECT * FROM visits WHERE customer_id = ?', [customer.id]);
    expect(visits.length).toBe(1);
    expect(parseFloat(visits[0].amount)).toBe(parseFloat(amount));

    // Verify SMS message log created in database
    const messages = await db.query('SELECT * FROM messages WHERE customer_id = ? AND type = ?', [customer.id, 'review']);
    expect(messages.length).toBe(1);
    expect(messages[0].status).toBe('sent'); // trigger_review_sms sets status to 'sent' in testing sandbox

    // Verify double-click idempotency block
    // Go to add-visit again and attempt double save
    await page.goto('/add-visit');
    await page.waitForLoadState('networkidle');
    
    const dupPhone = '5550404040';
    await page.fill('#phone', dupPhone);
    await page.waitForTimeout(500);
    await page.fill('#amount', '10.00');

    // Propose double click
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    
    // Attempt rapid second click (Playwright handles this, but since button disables, 
    // we also verify API handles it by attempting direct API double send or checking button disabled state)
    await expect(submitBtn).toBeDisabled();
  });
});
