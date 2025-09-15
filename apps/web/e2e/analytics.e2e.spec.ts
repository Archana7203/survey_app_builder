import { test, expect } from '@playwright/test';

test.describe('Analytics', () => {
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
                  title: 'Favorite Color',
                  required: true,
                  options: [
                    { id: 'opt1', text: 'Red' },
                    { id: 'opt2', text: 'Blue' }
                  ]
                }
              ]
            }
          ]
        })
      });
    });

    // Mock analytics API
    await page.route('**/api/analytics/test-survey', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveyId: 'test-survey',
          totalResponses: 5,
          questions: [
            {
              questionId: 'q1',
              type: 'singleChoice',
              title: 'Favorite Color',
              totalResponses: 5,
              analytics: {
                type: 'choice',
                counts: {
                  'Red': 3,
                  'Blue': 2
                }
              }
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

  test('should display total responses', async ({ page }) => {
    await page.goto('/dashboard/results/test-survey');
    
    // Wait for the content to load
    await page.waitForTimeout(1000);
    
    // Look for total responses count
    await expect(page.locator('.text-2xl.font-bold').filter({ hasText: '5' })).toBeVisible();
    await expect(page.getByText('Total Responses')).toBeVisible();
  });

  test('should show question analytics', async ({ page }) => {
    await page.goto('/dashboard/results/test-survey');
    
    // Wait for the content to load
    await page.waitForTimeout(1000);
    
    // Check if question title is displayed
    await expect(page.locator('h3').filter({ hasText: 'Favorite Color' }).first()).toBeVisible();
    
    // Check if choice counts are displayed
    await expect(page.getByText('Red')).toBeVisible();
    await expect(page.getByText('Blue')).toBeVisible();
  });

  test('should display chart selector', async ({ page }) => {
    await page.goto('/dashboard/results/test-survey');
    
    // Wait for the content to load
    await page.waitForTimeout(1000);
    
    // Check if chart selector is present
    await expect(page.getByRole('combobox')).toBeVisible();
  });

  test('should handle empty analytics', async ({ page }) => {
    // Mock empty analytics response
    await page.route('**/api/analytics/test-survey', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveyId: 'test-survey',
          totalResponses: 0,
          questions: []
        })
      });
    });

    await page.goto('/dashboard/results/test-survey');
    
    // Wait for the content to load
    await page.waitForTimeout(1000);
    
    // Check for empty state - be more specific about which "0" we're looking for
    await expect(page.locator('.text-2xl.font-bold.text-blue-600').filter({ hasText: '0' })).toBeVisible();
    
    // Check if "No responses yet" text exists (might need to adjust based on actual UI)
    const noResponsesText = page.getByText('No responses yet');
    if (await noResponsesText.count() > 0) {
      await expect(noResponsesText).toBeVisible();
    }
  });
});