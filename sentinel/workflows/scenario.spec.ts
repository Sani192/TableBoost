import { test, expect } from '@playwright/test';
import { loginViaUI } from '../core/session';
import { DatabaseClient } from '../core/database';
import { DatasetGenerator } from '../core/scenario_engine/dataset_generator';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Helper to extract values from UI cards
async function getStatValue(page: any, label: string): Promise<string> {
  const labelPara = page.locator('p', { hasText: new RegExp(`^${label}$`, 'i') }).first();
  await expect(labelPara).toBeVisible();
  const valuePara = labelPara.locator('xpath=../p[contains(@class, "text-2xl") or contains(@class, "font-extrabold") or contains(@class, "text-3xl") or contains(@class, "text-stone-900")]').first();
  await expect(valuePara).toBeVisible();
  return (await valuePara.innerText()).trim();
}

test.describe('Autonomous Governance: KPI Math & Scenario Correctness', () => {
  let db: DatabaseClient;
  let generator: DatasetGenerator;
  const reportPath = path.resolve(__dirname, '../reports/governance_audit.json');

  test.beforeAll(async () => {
    db = new DatabaseClient();
    await db.connect();
    generator = new DatasetGenerator(db);

    // Ensure reports directory exists
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  });

  test.afterAll(async () => {
    await db.disconnect();
  });

  test('E2E Cohort Calculations match Live UI Segment Stats', async ({ page }) => {
    // 1. Seed the synthetic cohorts
    console.log('Seeding synthetic customer cohorts...');
    await generator.seedAll();

    // 2. Trigger the intelligence pipeline (daily cron job recalculation)
    console.log('Executing daily_intelligence recalculation pipeline...');
    const pythonBin = path.resolve(__dirname, '../../backend/.venv/bin/python3');
    const runJobScript = path.resolve(__dirname, '../fixtures/run_system_job.py');
    execSync(`"${pythonBin}" "${runJobScript}" daily_intelligence`, {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || 'sqlite:///' + path.resolve(__dirname, '../../sentinel_test.db')
      }
    });

    // 3. Log in to dashboard as Owner
    await loginViaUI(page, 'sentinel_owner', 'password123');
    await expect(page).toHaveURL(/\/$/);
    await page.waitForLoadState('networkidle');

    // 4. Switch to the Intelligence tab
    console.log('Navigating to Intelligence tab...');
    await page.getByRole('button', { name: /intelligence/i }).first().click();
    await page.waitForTimeout(500);

    // 5. Gather live UI Stats
    const uiVips = parseInt(await getStatValue(page, 'VIP Segments'), 10);
    const uiAtRisk = parseInt(await getStatValue(page, 'At Risk'), 10);
    const uiNearReward = parseInt(await getStatValue(page, 'Near Reward'), 10);
    const uiLost = parseInt(await getStatValue(page, 'Lost Customers'), 10);
    const uiNewBlood = parseInt(await getStatValue(page, 'New Blood'), 10);

    // 6. Query DB Truth values
    const dbVips = (await db.query(
      "SELECT COUNT(*) as count FROM customer_intelligence WHERE clv_tier = 'high' AND restaurant_id = 1"
    ))[0].count;

    const dbAtRisk = (await db.query(
      "SELECT COUNT(*) as count FROM customer_intelligence WHERE health_status = 'churn_risk' AND restaurant_id = 1"
    ))[0].count;

    const dbNearReward = (await db.query(`
      SELECT COUNT(DISTINCT c.id) as count FROM customers c
      JOIN loyalty_progress lp ON c.id = lp.customer_id
      WHERE c.restaurant_id = 1 AND EXISTS (
        SELECT 1 FROM loyalty_rewards lr
        WHERE lr.restaurant_id = 1 AND lr.reward_type = 'milestone' AND lr.is_active = 1
        AND lr.required_visits - lp.lifetime_visits <= 2 AND lr.required_visits - lp.lifetime_visits >= 0
      )
    `))[0].count;

    const dbLost = (await db.query(
      "SELECT COUNT(*) as count FROM customer_intelligence WHERE health_status = 'lost' AND restaurant_id = 1"
    ))[0].count;

    const dbNewBlood = (await db.query(
      "SELECT COUNT(*) as count FROM customer_intelligence WHERE health_status = 'new' AND restaurant_id = 1"
    ))[0].count;

    // Compile governance report
    const auditReport = {
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      contracts: [
        { name: 'VIP Spenders CLV Tier', ui: uiVips, db: dbVips, matched: uiVips === dbVips },
        { name: 'At Risk Health Segment', ui: uiAtRisk, db: dbAtRisk, matched: uiAtRisk === dbAtRisk },
        { name: 'Near Milestone Reward Tracker', ui: uiNearReward, db: dbNearReward, matched: uiNearReward === dbNearReward },
        { name: 'Lost Customers Segment', ui: uiLost, db: dbLost, matched: uiLost === dbLost },
        { name: 'New Blood Healthy Segment', ui: uiNewBlood, db: dbNewBlood, matched: uiNewBlood === dbNewBlood }
      ]
    };

    // Fail test if any drifts are found
    const failures = auditReport.contracts.filter(c => !c.matched);
    if (failures.length > 0) {
      auditReport.status = 'DRIFT_DETECTED';
      fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
      throw new Error(`Semantic Drift detected in segments: ${failures.map(f => f.name).join(', ')}`);
    }

    fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));

    // Final Playwright assertions
    expect(uiVips).toBe(dbVips);
    expect(uiAtRisk).toBe(dbAtRisk);
    expect(uiNearReward).toBe(dbNearReward);
    expect(uiLost).toBe(dbLost);
    expect(uiNewBlood).toBe(dbNewBlood);
  });
});
