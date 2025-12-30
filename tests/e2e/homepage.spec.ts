/**
 * E2E tests for homepage
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NavaFlow/);
  });

  test('should display main chat interface', async ({ page }) => {
    await page.goto('/');
    // Wait for main chat to load
    await page.waitForSelector('[data-testid="main-chat"]', { timeout: 5000 });
  });
});
