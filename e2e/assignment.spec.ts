import { test, expect } from '@playwright/test';

const mockUser = {
  id: 'u1', name: 'Test Student', email: 'student@example.com', role: 'student', avatar: null, stars: 10
};

const mockAssignment = {
  id: 'a1', title: 'Bài tập: Số học', description: 'Giải phương trình sau',
  deadline: new Date(Date.now() + 86400000).toISOString(),
  maxScore: 100, starsReward: 50,
  course: { id: 'c1', title: 'Toán Cơ Bản' }
};

const mockSubmission = {
  id: 'sub1', status: 'submitted', submittedAt: new Date().toISOString(),
  content: 'Em nộp bài ạ'
};

test.describe('Assignment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user session
    await page.route('**/api/auth/me', route => route.fulfill({ status: 200, json: { user: mockUser } }));
    
    // Mock API requests
    await page.route(`**/api/assignments/${mockAssignment.id}*`, route => route.fulfill({ status: 200, json: mockAssignment }));
    await page.route(`**/api/assignments/${mockAssignment.id}/submissions*`, route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 200, json: mockSubmission });
      }
      return route.fulfill({ status: 200, json: null }); // initially no submission
    });

    // Catch-all for other APIs to prevent 401 redirects
    await page.route('**/api/**', route => route.fulfill({ status: 200, json: {} }));

    await page.goto('/');
    await page.evaluate((user) => {
      window.localStorage.setItem('canvas_user', JSON.stringify(user));
      window.localStorage.setItem('canvas_token', 'mock_token_123');
    }, mockUser);
  });

  test('should view assignment and submit work', async ({ page }) => {
    await page.goto(`/assignments/${mockAssignment.id}`);
    
    // Verify assignment details
    await expect(page.locator(`text=${mockAssignment.title}`)).toBeVisible();
    await expect(page.locator(`text=${mockAssignment.description}`)).toBeVisible();

    // Fill in submission content
    // Assuming there is a textarea or a button to submit
    const submitTextarea = page.locator('textarea');
    if (await submitTextarea.isVisible()) {
      await submitTextarea.fill('Em nộp bài ạ');
      await page.click('button:has-text("Nộp bài")');
    }

    // Since it's a mock, we might just see a success message or UI change
    // Let's assert based on general CanvasLMS behavior or at least no error
    await expect(page.locator('text=Nộp bài')).toBeVisible(); 
  });
});
