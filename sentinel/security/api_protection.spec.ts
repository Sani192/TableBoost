import { test, expect } from '@playwright/test';

test.describe('API Security & Abuse Protection Audits', () => {
  test.afterEach(async ({ request }) => {
    await request.post('/api/auth/reset-rate-limit');
  });

  test('Brute-force protection: Login rate limits after 5 failures', async ({ request }) => {
    // Attempt login 5 times with invalid credentials
    for (let i = 0; i < 5; i++) {
      const response = await request.post('/api/auth/login', {
        data: {
          username: 'sentinel_owner',
          password: 'wrong_password_attempt'
        }
      });
      // Should be 401 Unauthorized
      expect(response.status()).toBe(401);
    }

    // The 6th attempt should trigger rate limiting
    const rateLimitedRes = await request.post('/api/auth/login', {
      data: {
        username: 'sentinel_owner',
        password: 'wrong_password_attempt'
      }
    });

    // Verify 429 Too Many Requests response code
    expect(rateLimitedRes.status()).toBe(429);
    const body = await rateLimitedRes.json();
    expect(body.message).toContain('Too many login attempts');
  });

  test('Input bounds validation: Reject invalid visits payloads', async ({ request }) => {
    // 1. Log in to get active session context
    const loginRes = await request.post('/api/auth/login', {
      data: {
        username: 'sentinel_owner',
        password: 'password123'
      }
    });
    expect(loginRes.ok()).toBe(true);

    // 2. Attempt visit creation with negative amount
    const negativeRes = await request.post('/api/visits/', {
      data: {
        phone_number: '5559999999',
        amount: -15.50, // Negative amount
        send_sms: false
      }
    });
    expect(negativeRes.status()).toBe(422);
    const bodyNeg = await negativeRes.json();
    expect(bodyNeg.message).toContain('Validation failed');

    // 3. Attempt visit creation with invalid name length (> 100 characters)
    const longName = 'A'.repeat(101);
    const longNameRes = await request.post('/api/visits/', {
      data: {
        phone_number: '5559999999',
        name: longName,
        amount: 20.00,
        send_sms: false
      }
    });
    expect(longNameRes.status()).toBe(422);
    const bodyLong = await longNameRes.json();
    expect(bodyLong.message).toContain('Validation failed');
  });
});
