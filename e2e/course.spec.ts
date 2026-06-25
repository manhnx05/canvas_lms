import { test, expect } from '@playwright/test';

const mockUser = {
  id: 'u1', name: 'Test Student', email: 'student@example.com', role: 'student', avatar: null, stars: 10
};

const mockCourses = [
  { id: 'c1', title: 'Toán học Cơ bản', subject: 'Toán', gradeLevel: 5, status: 'published', studentsCount: 1 }
];

const mockCourseDetail = {
  ...mockCourses[0],
  description: 'Môn toán thú vị',
  teacher: { name: 'Thầy Toán' },
  modules: [
    { id: 'm1', title: 'Chương 1: Phép cộng', order: 1, isPublished: true, 
      lessons: [{ id: 'l1', title: 'Bài 1: Cộng hai số', type: 'video' }] }
  ]
};

test.describe('Course Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user session
    await page.route('**/api/auth/me', route => route.fulfill({ status: 200, json: { user: mockUser } }));
    
    // Mock API requests
    await page.route('**/api/courses*', route => route.fulfill({ status: 200, json: mockCourses }));
    await page.route('**/api/courses/c1*', route => route.fulfill({ status: 200, json: mockCourseDetail }));
    await page.route('**/api/enrollment/c1*', route => route.fulfill({ status: 200, json: { isEnrolled: true } }));
    
    // Catch-all for other APIs to prevent 401 redirects
    await page.route('**/api/**', route => route.fulfill({ status: 200, json: {} }));

    // Inject fake token
    await page.goto('/');
    await page.evaluate((user) => {
      window.localStorage.setItem('canvas_user', JSON.stringify(user));
      window.localStorage.setItem('canvas_token', 'mock_token_123');
    }, mockUser);
  });

  test('should view course list and course details', async ({ page }) => {
    await page.goto('/courses');
    
    // Check course list
    await expect(page.locator('text=Toán học Cơ bản')).toBeVisible();
    await expect(page.locator('text=Toán')).toBeVisible();

    // Click into course details
    await page.click('text=Toán học Cơ bản');
    await expect(page).toHaveURL(/.*\/courses\/c1/);

    // Check course detail contents
    await expect(page.locator('text=Môn toán thú vị')).toBeVisible();
    await expect(page.locator('text=Thầy Toán')).toBeVisible();
    await expect(page.locator('text=Chương 1: Phép cộng')).toBeVisible();
    await expect(page.locator('text=Bài 1: Cộng hai số')).toBeVisible();
  });
});
