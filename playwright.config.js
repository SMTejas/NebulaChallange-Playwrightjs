// Playwright configuration for running Chrome in incognito mode
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './',
  timeout: 60000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  
  use: {
    // Use Chrome in incognito mode as per requirements
    headless: false, // Set to true for headless execution
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium-incognito',
      use: {
        ...devices['Desktop Chrome'],
        // Launch browser in incognito mode
        launchOptions: {
          args: ['--incognito'],
        },
      },
    },
  ],
});
