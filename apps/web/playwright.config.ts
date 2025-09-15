import 'dotenv/config';
declare const process: { env?: Record<string, string | undefined> };
const __env: Record<string, string | undefined> = (typeof process !== 'undefined' && process.env) ? process.env : {};
import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!__env.CI,
  /* No retries for any environment */
  retries: 0,
  /* Always use 1 worker for all environments */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: __env.FRONTEND_URL || 'https://clearing-entertaining-quit-dicke.trycloudflare.com',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 15000, // Increased for cloud latency
    
    /* Global timeout for navigation */
    navigationTimeout: 45000, // Increased for cloud latency
    /* Extra HTTP headers for all requests */
    extraHTTPHeaders: {
      'User-Agent': 'Playwright E2E Tests',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'],
         launchOptions: {
          slowMo: 1000,  
        },
       },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests (only if not using cloud URLs) */
  webServer: __env.FRONTEND_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !__env.CI,
    timeout: 120 * 1000,
  },

  /* Global test timeout */
  timeout: 60 * 1000, // Increased for cloud testing
  
  /* Expect timeout */
  expect: {
    timeout: 10000, // Increased for cloud latency
  },

  /* Test output directory */
  outputDir: 'test-results/',
  
  /* Global setup and teardown */
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
});
