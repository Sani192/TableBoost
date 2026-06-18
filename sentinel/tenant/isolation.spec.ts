import { test, expect } from '@playwright/test';
import { loginViaUI } from '../core/session';

test.describe('Tenant Isolation Verification Matrix', () => {

  test.beforeEach(async ({ page }) => {
    // Log in as Owner of Restaurant 1 (sentinel_owner)
    await loginViaUI(page, 'sentinel_owner', 'password123');
    await expect(page).toHaveURL(/\/$/);
  });

  test('Cross-tenant API request header manipulation is BLOCKED', async ({ page }) => {
    // Attempt to access Restaurant 2 (Leak Palace, ID: 2) data by forging X-Restaurant-ID header
    const responseStatus = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/customers/', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'X-Restaurant-ID': '2', // Forged tenant ID
          }
        });
        return res.status;
      } catch (e) {
        return 999;
      }
    });

    // The backend must detect the mismatch and return 403 Forbidden
    expect(responseStatus).toBe(403);
  });

  test('Direct URL ID parameter manipulation is BLOCKED', async ({ page }) => {
    // Bob Leaker (ID: 2) belongs to Restaurant 2. 
    // Owner of Restaurant 1 attempts to load customer details page for ID 2.
    await page.goto('/customers/2');
    await page.waitForLoadState('networkidle');

    // The backend should return a 404 because customer 2 doesn't exist within Restaurant 1's context.
    // The UI should display "Customer not found" or show an error state.
    await expect(page.getByText(/not found/i).first()).toBeVisible();
    
    // Check direct API fetch for Tenant 2 customer returns 404
    const apiStatus = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/customers/2', {
          credentials: 'include'
        });
        return res.status;
      } catch (e) {
        return 999;
      }
    });
    expect(apiStatus).toBe(404);
  });

  test('Search filtering prevents cross-tenant data leakage', async ({ page }) => {
    // Navigate to Customer directory
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    // Search for Bob Leaker's phone number (5550202000) which belongs to Restaurant 2
    const searchInput = page.locator('input[placeholder*="search" i]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('5550202000');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify Bob Leaker is NOT displayed
    await expect(page.getByText('Bob Leaker')).not.toBeVisible();
    await expect(page.getByText(/no customers/i).or(page.locator('tbody tr'))).toBeVisible();
  });
});
