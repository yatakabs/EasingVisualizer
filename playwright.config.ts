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

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: isCI,
  
  /* Retry on CI only */
  retries: isCI ? 2 : 0,
  
  /* Opt out of parallel tests on CI for stability */
  workers: isCI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL - use environment variable or default to localhost:5173 */
    baseURL,
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* 
   * Run dev server before starting tests
   * - In CI: Always start fresh server on port 5173
   * - Locally: Reuse existing server if available, or start new one
   */
  webServer: {
    command: isCI ? 'npm run dev -- --port 5173 --strictPort' : 'npm run dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Global timeout for each test */
  timeout: 60 * 1000,
  
  /* Timeout for each assertion/expect */
  expect: {
    timeout: 10 * 1000,
  },
})
