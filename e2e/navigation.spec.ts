import { test, expect } from '@playwright/test';

// Mock user data matching the app's User type
const mockUser = {
  id: 'e2e-user-123',
  name: 'Test Student',
  email: 'student@example.com',
  role: 'student',
  avatar: null,
  stars: 0
};

test.describe('Navigation Flow', () => {
  // Inject mock user into localStorage before navigation to bypass login
  test.beforeEach(async ({ page }) => {
    // Mock API requests to avoid 401 errors since we use a fake token
    await page.route('**/api/**', async route => {
      const url = route.request().url();
      if (url.includes('/auth/me')) {
        await route.fulfill({ status: 200, json: { user: mockUser } });
      } else if (url.includes('/courses') || url.includes('/assignments')) {
        await route.fulfill({ status: 200, json: [] });
      } else {
        await route.fulfill({ status: 200, json: {} });
      }
    });

    // Navigate to a blank page first so we can inject into localStorage for the domain
    await page.goto('/');
    await page.evaluate((user) => {
      window.localStorage.setItem('canvas_user', JSON.stringify(user));
      window.localStorage.setItem('canvas_token', 'mock_token_123');
    }, mockUser);
    // Navigate again to load the app with the mock user
    await page.goto('/');
  });

  test('should navigate between main sections successfully', async ({ page }) => {
    // 1. Start at Dashboard
    await expect(page.locator('nav a[href="/"]').first()).toBeAttached({ timeout: 10000 });

    const openMenu = async () => {
      const menuBtn = page.locator('button').filter({ has: page.locator('svg.lucide-menu') }).first();
      if (await menuBtn.isVisible()) {
        await menuBtn.click();
        await page.waitForTimeout(500);
      }
    };

    // 2. Navigate to Courses
    await openMenu();
    await page.locator('nav a[href="/courses"]').first().click();
    await expect(page).toHaveURL(/.*\/courses/);

    // 3. Navigate to Inbox
    await openMenu();
    await page.locator('nav a[href="/inbox"]').first().click();
    await expect(page).toHaveURL(/.*\/inbox/);
  });
});
