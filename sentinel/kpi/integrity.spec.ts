import { test, expect, Page } from '@playwright/test';
import { loginViaUI } from '../core/session';
import { DatabaseClient } from '../core/database';
import * as fs from 'fs';
import * as path from 'path';

// Helper to extract numeric/currency values from UI cards
async function getStatValue(page: Page, label: string): Promise<string> {
  const labelPara = page.locator('p', { hasText: new RegExp(`^${label}$`, 'i') }).first();
  await expect(labelPara).toBeVisible();
  const valuePara = labelPara.locator('xpath=../p[contains(@class, "text-2xl") or contains(@class, "font-extrabold") or contains(@class, "text-3xl")]').first();
  await expect(valuePara).toBeVisible();
  return (await valuePara.innerText()).trim();
}

test.describe('KPI Integrity Dashboard Audits', () => {
  let db: DatabaseClient;
  const mismatchLogPath = path.resolve(__dirname, '../reports/kpi_mismatches.json');

  test.beforeAll(async () => {
    db = new DatabaseClient();
    await db.connect();
    
    // Ensure reporting directories exist
    fs.mkdirSync(path.dirname(mismatchLogPath), { recursive: true });
    if (!fs.existsSync(mismatchLogPath)) {
      fs.writeFileSync(mismatchLogPath, JSON.stringify([], null, 2));
    }
  });

  test.afterAll(async () => {
    await db.disconnect();
  });

  function logMismatch(kpiName: string, ui: string, dbTruth: string, query: string) {
    const log = JSON.parse(fs.readFileSync(mismatchLogPath, 'utf8'));
    log.push({
      timestamp: new Date().toISOString(),
      kpi_name: kpiName,
      ui_value: ui,
      db_truth: dbTruth,
      query_executed: query,
    });
    fs.writeFileSync(mismatchLogPath, JSON.stringify(log, null, 2));
  }

  test('UI KPI StatCards match database aggregates', async ({ page }) => {
    await loginViaUI(page, 'sentinel_owner', 'password123');
    await expect(page).toHaveURL(/\/$/);
    await page.waitForLoadState('networkidle');

    // 1. Total Customers Check
    const qCustomers = 'SELECT COUNT(id) AS count FROM customers WHERE restaurant_id = 1';
    const dbCustomers = (await db.query(qCustomers))[0].count;
    const uiCustomers = await getStatValue(page, 'Customers');
    if (parseInt(uiCustomers, 10) !== dbCustomers) {
      logMismatch('Customers', uiCustomers, dbCustomers.toString(), qCustomers);
    }
    expect(parseInt(uiCustomers, 10)).toBe(dbCustomers);

    // 2. Total Visits Check
    const qVisits = 'SELECT COUNT(id) AS count FROM visits WHERE restaurant_id = 1';
    const dbVisits = (await db.query(qVisits))[0].count;
    const uiVisits = await getStatValue(page, 'Total Visits');
    if (parseInt(uiVisits, 10) !== dbVisits) {
      logMismatch('Total Visits', uiVisits, dbVisits.toString(), qVisits);
    }
    expect(parseInt(uiVisits, 10)).toBe(dbVisits);

    // 3. Repeat Rate Check (Repeat rate card on dashboard)
    const qRepeat = `
      SELECT COUNT(*) AS count FROM (
        SELECT customer_id FROM visits 
        WHERE restaurant_id = 1 
        GROUP BY customer_id HAVING COUNT(id) > 1
      )
    `;
    const dbRepeatCustomers = (await db.query(qRepeat))[0].count;
    const expectedRepeatRate = Math.round((dbRepeatCustomers / (dbCustomers || 1)) * 100);
    const uiRepeatRateText = await getStatValue(page, 'Repeat Rate');
    const uiRepeatRate = parseInt(uiRepeatRateText.replace('%', ''), 10);
    if (uiRepeatRate !== expectedRepeatRate) {
      logMismatch('Repeat Rate', uiRepeatRateText, expectedRepeatRate + '%', qRepeat);
    }
    expect(uiRepeatRate).toBe(expectedRepeatRate);

    // 4. Redeemed Rewards Check
    const qRedeemed = 'SELECT COUNT(id) AS count FROM reward_redemptions WHERE restaurant_id = 1';
    const dbRedeemed = (await db.query(qRedeemed))[0].count;
    const uiRedeemed = await getStatValue(page, 'Redeemed');
    if (parseInt(uiRedeemed, 10) !== dbRedeemed) {
      logMismatch('Redeemed', uiRedeemed, dbRedeemed.toString(), qRedeemed);
    }
    expect(parseInt(uiRedeemed, 10)).toBe(dbRedeemed);
  });
});
