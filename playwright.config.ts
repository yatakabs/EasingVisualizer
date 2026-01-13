import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for EasingVisualizer E2E tests
 * @see https://playwright.dev/docs/test-configuration
 * 
 * Usage:
 * - Default: `npm run test:e2e` (starts server automatically)
 * - With running server: Set PLAYWRIGHT_BASE_URL to your dev server URL
 * - CI: Set CI=true for strict port and no server reuse
 */

// Vite dev server runs on port 5000 by default
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000'
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: isCI,
  
  /* Retry on CI only - reduced for faster feedback */
  retries: isCI ? 1 : 0,
  
  /* Limit parallel workers to prevent server contention */
  workers: isCI ? 2 : 4,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL - use environment variable or default to localhost:5173 */
    baseURL,
    
    /* Faster action/navigation timeouts */
    actionTimeout: 5000,      // 5s for clicks/fills
    navigationTimeout: 10000, // 10s for navigation
    
    /* Reduce trace overhead - only keep on failure */
    trace: 'retain-on-failure',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Disable video for performance */
    video: 'off',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
    },
  ],

  /* 
   * Run dev server before starting tests
   * - In CI: Always start fresh server on port 5000
   * - Locally: Reuse existing server if available, or start new one
   */
  webServer: {
    command: isCI ? 'npm run dev -- --port 5000 --strictPort' : 'npm run dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 60 * 1000,  // 60s for server startup
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Global timeout - 30 seconds for E2E tests */
  timeout: 30 * 1000,
  
  /* Assertion timeout - 5 seconds */
  expect: {
    timeout: 5 * 1000,
  },
})
