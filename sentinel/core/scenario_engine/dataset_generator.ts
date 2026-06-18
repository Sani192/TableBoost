import { DatabaseClient } from '../database';

export class DatasetGenerator {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  private formatSqliteDate(date: Date): string {
    return date.toISOString().replace('Z', '');
  }

  /**
   * Helper to clean up existing synthetic cohorts to make the seed idempotent.
   */
  async cleanup(): Promise<void> {
    const phones = [
      '5551111111', // VIP
      '5552222222', // Churn Risk
      '5553333333', // Near Reward
      '5554444444', // New Customer
      '5555555555'  // Lost Customer
    ];
    
    for (const phone of phones) {
      // Find customer ID
      const rows = await this.db.query('SELECT id FROM customers WHERE phone_number = ?', [phone]);
      if (rows.length > 0) {
        const customerId = rows[0].id;
        await this.db.execute('DELETE FROM visits WHERE customer_id = ?', [customerId]);
        await this.db.execute('DELETE FROM customer_profiles WHERE customer_id = ?', [customerId]);
        await this.db.execute('DELETE FROM loyalty_progress WHERE customer_id = ?', [customerId]);
        await this.db.execute('DELETE FROM customer_intelligence WHERE customer_id = ?', [customerId]);
        await this.db.execute('DELETE FROM customers WHERE id = ?', [customerId]);
      }
    }
  }

  /**
   * Seeds a VIP Spender: 15 active visits, total spend > $1500, recent visits.
   */
  async seedVipSpender(): Promise<void> {
    const phone = '5551111111';
    const name = 'Victoria VIP';
    const restaurantId = 1;
    const now = new Date();

    // Insert customer
    await this.db.execute(
      'INSERT INTO customers (restaurant_id, phone_number, name, created_at) VALUES (?, ?, ?, ?)',
      [restaurantId, phone, name, this.formatSqliteDate(now)]
    );
    const rows = await this.db.query('SELECT id FROM customers WHERE phone_number = ?', [phone]);
    const customerId = rows[0].id;

    // Insert 15 active visits spread over the last 30 days
    for (let i = 0; i < 15; i++) {
      const visitDate = new Date();
      visitDate.setDate(now.getDate() - i * 2);
      await this.db.execute(
        'INSERT INTO visits (restaurant_id, customer_id, amount, status, visited_at) VALUES (?, ?, ?, ?, ?)',
        [restaurantId, customerId, 120.00, 'active', this.formatSqliteDate(visitDate)]
      );
    }

    // Insert Loyalty Progress
    await this.db.execute(
      'INSERT INTO loyalty_progress (customer_id, lifetime_visits) VALUES (?, ?)',
      [customerId, 15]
    );
  }

  /**
   * Seeds a Churn Risk: historical frequent visits, but last visit was 45 days ago.
   */
  async seedChurnRisk(): Promise<void> {
    const phone = '5552222222';
    const name = 'Connor Churn';
    const restaurantId = 1;
    const now = new Date();

    // Insert customer
    await this.db.execute(
      'INSERT INTO customers (restaurant_id, phone_number, name, created_at) VALUES (?, ?, ?, ?)',
      [restaurantId, phone, name, this.formatSqliteDate(now)]
    );
    const rows = await this.db.query('SELECT id FROM customers WHERE phone_number = ?', [phone]);
    const customerId = rows[0].id;

    // Insert 8 visits, but the last one was 45 days ago
    for (let i = 0; i < 8; i++) {
      const visitDate = new Date();
      // Visits from 60 days ago to 45 days ago
      visitDate.setDate(now.getDate() - 45 - i * 2);
      await this.db.execute(
        'INSERT INTO visits (restaurant_id, customer_id, amount, status, visited_at) VALUES (?, ?, ?, ?, ?)',
        [restaurantId, customerId, 50.00, 'active', this.formatSqliteDate(visitDate)]
      );
    }

    // Insert Loyalty Progress
    await this.db.execute(
      'INSERT INTO loyalty_progress (customer_id, lifetime_visits) VALUES (?, ?)',
      [customerId, 8]
    );
  }

  /**
   * Seeds a Near-Reward customer: 4 visits (unlocks Free Burger at 5 visits).
   */
  async seedNearReward(): Promise<void> {
    const phone = '5553333333';
    const name = 'Nicholas Near';
    const restaurantId = 1;
    const now = new Date();

    // Insert customer
    await this.db.execute(
      'INSERT INTO customers (restaurant_id, phone_number, name, created_at) VALUES (?, ?, ?, ?)',
      [restaurantId, phone, name, this.formatSqliteDate(now)]
    );
    const rows = await this.db.query('SELECT id FROM customers WHERE phone_number = ?', [phone]);
    const customerId = rows[0].id;

    // Insert 4 visits
    for (let i = 0; i < 4; i++) {
      const visitDate = new Date();
      visitDate.setDate(now.getDate() - i * 5);
      await this.db.execute(
        'INSERT INTO visits (restaurant_id, customer_id, amount, status, visited_at) VALUES (?, ?, ?, ?, ?)',
        [restaurantId, customerId, 30.00, 'active', this.formatSqliteDate(visitDate)]
      );
    }

    // Insert Loyalty Progress
    await this.db.execute(
      'INSERT INTO loyalty_progress (customer_id, lifetime_visits) VALUES (?, ?)',
      [customerId, 4]
    );
  }

  /**
   * Seeds a New Customer: exactly 1 visit.
   */
  async seedNewCustomer(): Promise<void> {
    const phone = '5554444444';
    const name = 'Newbie Ned';
    const restaurantId = 1;
    const now = new Date();

    await this.db.execute(
      'INSERT INTO customers (restaurant_id, phone_number, name, created_at) VALUES (?, ?, ?, ?)',
      [restaurantId, phone, name, this.formatSqliteDate(now)]
    );
    const rows = await this.db.query('SELECT id FROM customers WHERE phone_number = ?', [phone]);
    const customerId = rows[0].id;

    await this.db.execute(
      'INSERT INTO visits (restaurant_id, customer_id, amount, status, visited_at) VALUES (?, ?, ?, ?, ?)',
      [restaurantId, customerId, 45.00, 'active', this.formatSqliteDate(now)]
    );

    await this.db.execute(
      'INSERT INTO loyalty_progress (customer_id, lifetime_visits) VALUES (?, ?)',
      [customerId, 1]
    );
  }

  /**
   * Seeds a Lost Customer: 100 days since last visit.
   */
  async seedLostCustomer(): Promise<void> {
    const phone = '5555555555';
    const name = 'Lawrence Lost';
    const restaurantId = 1;
    const now = new Date();

    await this.db.execute(
      'INSERT INTO customers (restaurant_id, phone_number, name, created_at) VALUES (?, ?, ?, ?)',
      [restaurantId, phone, name, this.formatSqliteDate(now)]
    );
    const rows = await this.db.query('SELECT id FROM customers WHERE phone_number = ?', [phone]);
    const customerId = rows[0].id;

    // Last visit 100 days ago
    const visitDate = new Date();
    visitDate.setDate(now.getDate() - 100);

    await this.db.execute(
      'INSERT INTO visits (restaurant_id, customer_id, amount, status, visited_at) VALUES (?, ?, ?, ?, ?)',
      [restaurantId, customerId, 60.00, 'active', this.formatSqliteDate(visitDate)]
    );

    await this.db.execute(
      'INSERT INTO loyalty_progress (customer_id, lifetime_visits) VALUES (?, ?)',
      [customerId, 1]
    );
  }

  /**
   * Master seed runner.
   */
  async seedAll(): Promise<void> {
    await this.cleanup();
    await this.seedVipSpender();
    await this.seedChurnRisk();
    await this.seedNearReward();
    await this.seedNewCustomer();
    await this.seedLostCustomer();
  }
}
