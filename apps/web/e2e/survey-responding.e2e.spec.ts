import { test, expect } from '@playwright/test';

let surveySlug: string;

test.describe('Survey Responding via Public Links', () => {
  test.beforeAll(async ({ request }) => {
    // Register a new user to get access token
    const testEmail = `test-${Date.now()}@example.com`;
    const registerResponse = await request.post('/api/auth/register', {
      data: {
        email: testEmail,
        password: 'TestPassword123!'
      }
    });
    const registerBody = await registerResponse.json();
    const token = registerBody.accessToken || registerBody.token;
    const userId = registerBody.user?._id || registerBody._id || registerBody.id;

    // Create survey (will be draft)
    const createResponse = await request.post('/api/surveys', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        title: 'Customer Satisfaction Survey',
        description: 'Please help us improve our services by completing this survey',
        status: 'published',
        allowedRespondents: [],
        theme: 'rose',
        pages: [
          {
            questions: [
              {
                id: 'q1',
                type: 'singleChoice',
                title: 'How satisfied are you with our service?',
                description: 'Please select one option',
                required: true,
                options: [
                  { id: 'opt1', text: 'Very Satisfied' },
                  { id: 'opt2', text: 'Satisfied' },
                  { id: 'opt3', text: 'Neutral' },
                  { id: 'opt4', text: 'Dissatisfied' },
                  { id: 'opt5', text: 'Very Dissatisfied' }
                ]
              },
              {
                id: 'q2',
                type: 'textShort',
                title: 'Your Name',
                required: true
              }
            ],
            branching: []
          },
          {
            questions: [
              {
                id: 'q3',
                type: 'ratingNumber',
                title: 'Rate our overall service',
                required: true,
                settings: { maxRating: 5 }
              }
            ],
            branching: []
          }
        ]
      }
    });
    const createBody = await createResponse.json();

    // Publish the survey
    const publishResponse = await request.put(`/api/surveys/${createBody.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        status: 'published'
      }
    });
    const publishBody = await publishResponse.json();

    // Use the returned slug for GET and public link
    surveySlug = createBody.slug;
    const getResponse = await request.get(`/api/surveys/by-slug/${surveySlug}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const getBody = await getResponse.json();
  });

  test.beforeEach(async ({ page }) => {
    // No mocks, just navigation
  });

  test('should load public survey correctly', async ({ page }) => {
    await page.goto(`/s/${surveySlug}`);
    // Verify survey header
    await expect(page.getByRole('heading', { name: 'Customer Satisfaction Survey' })).toBeVisible();
    await expect(page.getByText('Please select one option')).toBeVisible();

    // Verify question content
    await expect(page.getByText('How satisfied are you with our service?')).toBeVisible();
    await expect(page.getByText('Please select one option')).toBeVisible();
    
    // Verify options
    const options = page.getByRole('radio');
    await expect(options).toHaveCount(5);
    
    // Verify navigation
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  });

  test('should answer single choice textbox and rating questions', async ({ page }) => {
    await page.goto(`/s/${surveySlug}`);
    // Answer first question
    await expect(page.getByText('How satisfied are you with our service?')).toBeVisible();
    await page.getByRole('radio', { name: 'Very Satisfied' }).click();
    await expect(page.getByRole('radio', { checked: true })).toBeVisible();
    
    // Answer second question
    await expect(page.getByText('Your Name')).toBeVisible();
    await page.getByRole('textbox').fill('John Doe');
    
    // Navigate to next page
    await page.getByRole('button', { name: 'Next' }).click();
    
    // Verify second page
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
    await expect(page.getByText('Rate our overall service')).toBeVisible();
    await page.getByRole('button', { name: '4' }).click();
    await expect(page.getByRole('button', { pressed: true })).toHaveAttribute('aria-label', 'Rate 4 out of 5');
    await page.click('text=Submit Survey');
  });

  test('should validate required questions', async ({ page }) => {
    await page.goto(`/s/${surveySlug}`);
    
    // Try to go to next page without answering required questions
    await page.click('text=Next →');
    
    // Should show validation error
    await expect(page.getByText('Please answer all required questions before continuing')).toBeVisible();
    
    // Answer required questions
    await page.getByRole('radio', { name: 'Satisfied', exact: true }).click();
    await page.getByRole('textbox').fill('John Doe');
    
    // Now should be able to proceed
    await page.click('text=Next →');
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
  });

  test('should navigate between pages correctly', async ({ page }) => {
    await page.goto(`/s/${surveySlug}`);
    
    // Answer first page
    await page.getByRole('radio', { name: 'Satisfied', exact: true }).click();
    await page.getByRole('textbox').fill('John Doe');
    await page.click('text=Next →');
    
    // Verify we're on page 2
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
    await expect(page.getByText('Rate our overall service')).toBeVisible();
    
    // Go back to page 1
    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    await expect(page.getByText('How satisfied are you with our service?')).toBeVisible();
    
    // Verify answers are preserved
    await expect(page.locator('input[type="radio"]:checked')).toBeChecked();
    await expect(page.locator('input[type="text"]')).toHaveValue('John Doe');
  });

  test('should show progress indicators', async ({ page }) => {
    await page.goto(`/s/${surveySlug}`);
    
    // Check page dots indicator
    const pageDots = page.locator('.w-2.h-2.rounded-full');
    await expect(pageDots).toHaveCount(2);
    
    // First dot should be active
    await expect(pageDots.first()).toHaveClass(/bg-current/);
    
    // Second dot should be inactive
    await expect(pageDots.last()).toHaveClass(/opacity-20/);
    
    // Check page counter
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
  });

  test('should auto-save progress', async ({ page }) => {
    await page.goto(`/s/${surveySlug}`);
    
    // Answer first question
    await page.click('text=Satisfied');
    
    // Wait for auto-save (should happen after 60 seconds, but we can mock it)
    await page.waitForTimeout(100);
    
    // Check for auto-save indicator
    const autoSaveIndicator = page.locator('text=Your progress is automatically saved');
    await expect(autoSaveIndicator).toBeVisible();
  });

  test('should handle survey not found', async ({ page }) => {
    await page.goto('/s/non-existent-survey');
    
    // Should show error message
    await expect(page.locator('h3')).toContainText('Survey Not Available');
    await expect(page.locator('text=Survey not found')).toBeVisible();
  });
});


