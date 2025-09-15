import { test, expect } from '@playwright/test';

test.describe('Respondent Progress', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth check
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user', email: 'test@example.com' }
        })
      });
    });

    // Mock survey data API
    await page.route('**/api/surveys/test-survey', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-survey',
          title: 'Test Survey',
          description: 'A test survey',
          status: 'published',
          pages: [
            {
              questions: [
                {
                  id: 'q1',
                  type: 'singleChoice',
                  title: 'Test Question',
                  required: true,
                  options: [
                    { id: 'opt1', text: 'Option 1' },
                    { id: 'opt2', text: 'Option 2' }
                  ]
                }
              ]
            }
          ]
        })
      });
    });

    // Mock respondent progress API
    await page.route('**/api/surveys/test-survey/respondent-progress**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          survey: {
            id: 'test-survey',
            title: 'Test Survey',
            totalPages: 2,
            totalRespondents: 3
          },
          respondentProgress: [
            {
              email: 'user1@test.com',
              status: 'Completed',
              progress: 2,
              totalPages: 2,
              completionPercentage: 100,
              timeSpent: 180
            },
            {
              email: 'user2@test.com',
              status: 'InProgress', 
              progress: 1,
              totalPages: 2,
              completionPercentage: 50,
              timeSpent: 90
            }
          ]
        })
      });
    });

    // Set mock token in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token');
    });
  });

  test('should display total respondents', async ({ page }) => {
    await page.goto('/dashboard/surveys/test-survey/view');
    
    // Click on the "Respondent Progress" tab button specifically
    await page.getByRole('button', { name: 'Respondent Progress' }).click();
    
    // Wait for the content to load
    await page.waitForTimeout(1000);
    
    // Look for the specific stat card with class indicating it's the total count
    await expect(page.locator('.text-2xl.font-bold.text-blue-600').filter({ hasText: '3' })).toBeVisible();
    await expect(page.getByText('Total Respondents')).toBeVisible();
  });

  test('should show respondent emails', async ({ page }) => {
    await page.goto('/dashboard/surveys/test-survey/view');
    
    // Click on the "Respondent Progress" tab button specifically
    await page.getByRole('button', { name: 'Respondent Progress' }).click();
    
    // Wait for the content to load
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('user1@test.com')).toBeVisible();
    await expect(page.getByText('user2@test.com')).toBeVisible();
  });

  test('should display status badges', async ({ page }) => {
    await page.goto('/dashboard/surveys/test-survey/view');
    
    // Click on the "Respondent Progress" tab button specifically
    await page.getByRole('button', { name: 'Respondent Progress' }).click();
    
    // Wait for the content to load
    await page.waitForTimeout(1000);
    
    // Target the specific status badges in the table
    await expect(page.locator('span.inline-flex.px-2.py-1').filter({ hasText: 'Completed' })).toBeVisible();
    await expect(page.locator('span.inline-flex.px-2.py-1').filter({ hasText: 'InProgress' })).toBeVisible();
  });

  test('should show refresh button', async ({ page }) => {
    await page.goto('/dashboard/surveys/test-survey/view');
    
    // Click on the "Respondent Progress" tab button specifically
    await page.getByRole('button', { name: 'Respondent Progress' }).click();
    
    // Wait for the content to load
    await page.waitForTimeout(1000);
    
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
  });
});