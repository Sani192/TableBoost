import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.sentinel
dotenv.config({ path: path.resolve(__dirname, '../.env.sentinel') });

export default defineConfig({
  testDir: '../',
  testMatch: '**/*.spec.ts',
  timeout: 60 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false, // Run sequentially to avoid DB collision during assertions
  workers: 1,
  retries: 0,
  reporter: [
    ['html', { outputFolder: '../reports/html', open: 'never' }],
    ['junit', { outputFile: '../reports/junit.xml' }]
  ],
  use: {
    baseURL: process.env.SENTINEL_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 }
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 }
      },
    },
  ],
});
