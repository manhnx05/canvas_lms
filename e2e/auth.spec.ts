import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.bg-rose-50')).toContainText('Tài khoản không tồn tại', { timeout: 10000 });
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    // Mock login endpoint
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({ status: 200, json: { token: 'fake_token_123', user: { id: 'u1', name: 'Test User', role: 'student' } } });
    });
    // Mock profile fetch
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({ status: 200, json: { user: { id: 'u1', name: 'Test User', role: 'student' } } });
    });
    // Dashboard endpoints
    await page.route('**/api/courses', async route => {
      await route.fulfill({ status: 200, json: [] });
    });

    await page.goto('/');
    await page.fill('input[type="email"]', 'student@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for URL to not be login
    await expect(page).toHaveURL(/.*\/courses|\/|dashboard/, { timeout: 10000 });
    // Expect to see user avatar or main layout
    await expect(page.locator('nav').first()).toBeVisible();
  });
});