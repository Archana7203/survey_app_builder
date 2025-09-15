import { Page, expect } from '@playwright/test';
const __enc = new TextEncoder();
declare const process: { env?: Record<string, string | undefined> };
const __env: Record<string, string | undefined> = (typeof process !== 'undefined' && process.env) ? process.env : {};

/**
 * Test utilities for Survey App Builder E2E tests
 */

export class TestUtils {
  private backendUrl: string;
  
  constructor(private page: Page) {
    // Get backend URL from environment or use default
    this.backendUrl = __env.BACKEND_URL || 'http://localhost:3001';
  }

  /**
   * Mock authentication for tests
   */
  async mockAuth(user: { id: string; email: string } = { id: '123', email: 'test@example.com' }) {
    await this.page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user })
      });
    });
  }

  /**
   * Mock API calls to use the configured backend URL
   */
  async mockApiCalls() {
    // Intercept API calls and route them to the configured backend
    await this.page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      const newUrl = `${this.backendUrl}${url.pathname}${url.search}`;
      
      // Use Playwright's page.request.fetch to forward the request, handle headers and body correctly
      const method = route.request().method();
      const options: any = {
        method,
        headers: route.request().headers(),
      };
      // Only set body for methods that can have a body and if postData exists
      const postData = route.request().postData();
      if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && postData) {
        options.data = postData;
      }
      const playwrightResponse = await this.page.request.fetch(newUrl, options);
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(await playwrightResponse.headers())) {
        headers[key] = value as string;
      }
      await route.fulfill({
        status: playwrightResponse.status(),
        headers,
        body: await playwrightResponse.text(),
      });
    });
  }

  /**
   * Mock survey data
   */
  async mockSurvey(surveyId: string, surveyData: any) {
    await this.page.route(`**/api/surveys/${surveyId}*`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(surveyData)
      });
    });
  }

  /**
   * Mock surveys list
   */
  async mockSurveysList(surveys: any[]) {
    await this.page.route('**/api/surveys*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys,
          pagination: {
            page: 1,
            limit: 5,
            total: surveys.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
  }

  /**
   * Mock analytics data
   */
  async mockAnalytics(surveyId: string, analyticsData: any) {
    await this.page.route(`**/api/analytics/${surveyId}*`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(analyticsData)
      });
    });
  }

  /**
   * Mock respondent progress data
   */
  async mockRespondentProgress(surveyId: string, progressData: any) {
    await this.page.route(`**/api/responses/${surveyId}/progress*`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(progressData)
      });
    });
  }

  /**
   * Mock public survey data
   */
  async mockPublicSurvey(slug: string, surveyData: any) {
    await this.page.route(`**/api/surveys/public/${slug}*`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(surveyData)
      });
    });
  }

  /**
   * Mock API responses with error
   */
  async mockApiError(endpoint: string, status: number, error: string) {
    await this.page.route(`**${endpoint}*`, async route => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error })
      });
    });
  }

  /**
   * Mock WebSocket connection
   */
  async mockWebSocket() {
    await this.page.evaluate(() => {
      (window as any).io = () => ({
        on: (event: string, callback: (...args: any[]) => void) => {
          if (event === 'connect') {
            setTimeout(() => callback(), 100);
          }
        },
        emit: () => {},
        disconnect: () => {}
      });
    });
  }

  /**
   * Mock clipboard API
   */
  async mockClipboard() {
    await this.page.evaluate(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: () => Promise.resolve()
        }
      });
    });
  }

  /**
   * Wait for element to be visible and stable
   */
  async waitForElement(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for API call to complete
   */
  async waitForApiCall(endpoint: string, timeout: number = 10000) {
    await this.page.waitForResponse(response => 
      response.url().includes(endpoint) && response.status() === 200,
      { timeout }
    );
  }

  /**
   * Fill form with data
   */
  async fillForm(formData: Record<string, string>) {
    for (const [selector, value] of Object.entries(formData)) {
      await this.page.fill(selector, value);
    }
  }

  /**
   * Click button and wait for navigation
   */
  async clickAndWaitForNavigation(selector: string, url?: string) {
    await Promise.all([
      this.page.waitForURL(url || '**'),
      this.page.click(selector)
    ]);
  }

  /**
   * Drag and drop element
   */
  async dragAndDrop(sourceSelector: string, targetSelector: string) {
    const source = this.page.locator(sourceSelector);
    const target = this.page.locator(targetSelector);
    await source.dragTo(target);
  }

  /**
   * Take screenshot with custom name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Check for accessibility issues
   */
  async checkAccessibility() {
    // Check for proper headings
    await expect(this.page.locator('h1')).toBeVisible();
    
    // Check for proper labels
    const inputs = this.page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      if (id) {
        await expect(this.page.locator(`label[for="${id}"]`)).toBeVisible();
      }
    }
    
    // Check for proper button types
    await expect(this.page.locator('button[type="button"], button[type="submit"]')).toBeVisible();
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation() {
    // Test tab navigation
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab');
    
    // Test Enter key
    await this.page.keyboard.press('Enter');
    
    // Test Escape key
    await this.page.keyboard.press('Escape');
  }

  /**
   * Generate test data
   */
  generateTestData() {
    const timestamp = Date.now();
    return {
      email: `test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      surveyTitle: `Test Survey ${timestamp}`,
      surveyDescription: `Test survey description ${timestamp}`,
      questionTitle: `Test Question ${timestamp}`,
      respondentEmail: `respondent-${timestamp}@example.com`
    };
  }

  /**
   * Create a complete survey for testing
   */
  async createTestSurvey() {
    const testData = this.generateTestData();
    
    // Navigate to survey builder
    await this.page.goto('/dashboard/surveys/new');
    
    // Fill survey details
    await this.page.fill('input[placeholder="Enter survey title"]', testData.surveyTitle);
    await this.page.fill('input[placeholder="Describe your survey"]', testData.surveyDescription);
    
    // Add questions
    const singleChoice = this.page.locator('.question-type-item').filter({ hasText: 'Multiple choice' });
    const canvasArea = this.page.locator('.col-span-6 .border-dashed');
    await singleChoice.dragTo(canvasArea);
    
    // Configure question
    await this.page.fill('input[placeholder="Enter question"]', testData.questionTitle);
    await this.page.fill('input[placeholder="Option 1"]', 'Option 1');
    await this.page.fill('input[placeholder="Option 2"]', 'Option 2');
    
    return testData;
  }

  /**
   * Complete a survey as a respondent
   */
  async completeSurvey(slug: string) {
    await this.page.goto(`/s/${slug}`);
    
    // Answer questions
    await this.page.click('text=Satisfied');
    await this.page.fill('input[type="text"]', 'John Doe');
    await this.page.click('text=Next →');
    
    // Answer second page
    await this.page.fill('textarea', 'Great service!');
    await this.page.click('text=Submit Survey');
    
    // Wait for thank you page
    await this.page.waitForURL(`**/s/${slug}/thank-you`);
  }

  /**
   * Check for error messages
   */
  async expectError(message: string) {
    await expect(this.page.locator('.alert-error, [role="alert"]')).toContainText(message);
  }

  /**
   * Check for success messages
   */
  async expectSuccess(message: string) {
    await expect(this.page.locator('.alert-success, [role="alert"]')).toContainText(message);
  }

  /**
   * Check for loading states
   */
  async expectLoading() {
    await expect(this.page.locator('text=Loading..., text=Please wait..., text=Saving...')).toBeVisible();
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    await this.page.waitForSelector('text=Loading..., text=Please wait..., text=Saving...', { 
      state: 'hidden',
      timeout: 10000 
    });
  }

  /**
   * Mock file upload
   */
  async mockFileUpload(filename: string, content: string) {
    const testFile = {
      name: filename,
      mimeType: 'application/json',
      buffer: __enc.encode(content)
    };
    
    await this.page.setInputFiles('input[type="file"]', testFile);
  }

  /**
   * Mock file download
   */
  async mockFileDownload(endpoint: string, filename: string, content: string) {
    await this.page.route(`**${endpoint}*`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        headers: {
          'Content-Disposition': `attachment; filename="${filename}"`
        },
        body: __enc.encode(content)
      });
    });
  }

  /**
   * Check for proper form validation
   */
  async checkFormValidation() {
    // Check required fields
    const requiredInputs = this.page.locator('input[required], textarea[required], select[required]');
    const count = await requiredInputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = requiredInputs.nth(i);
      await expect(input).toHaveAttribute('required');
    }
    
    // Check email validation
    const emailInputs = this.page.locator('input[type="email"]');
    const emailCount = await emailInputs.count();
    
    for (let i = 0; i < emailCount; i++) {
      const input = emailInputs.nth(i);
      await expect(input).toHaveAttribute('type', 'email');
    }
  }

  /**
   * Test responsive design
   */
  async testResponsiveDesign() {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500); // Wait for layout to adjust
      
      // Take screenshot for each viewport
      await this.takeScreenshot(`${viewport.name.toLowerCase()}-${viewport.width}x${viewport.height}`);
    }
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    // Clear localStorage
    await this.page.evaluate(() => localStorage.clear());
    
    // Clear sessionStorage
    await this.page.evaluate(() => sessionStorage.clear());
    
    // Clear cookies
    await this.page.context().clearCookies();
  }
}

/**
 * Common test data generators
 */
export const TestData = {
  /**
   * Generate a random email
   */
  randomEmail(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
  },

  /**
   * Generate a random survey title
   */
  randomSurveyTitle(): string {
    return `Test Survey ${Date.now()}`;
  },

  /**
   * Generate a random question title
   */
  randomQuestionTitle(): string {
    return `Test Question ${Date.now()}`;
  },

  /**
   * Generate sample survey data
   */
  sampleSurvey() {
    return {
      id: 'test-survey-id',
      title: 'Customer Satisfaction Survey',
      description: 'Please help us improve our services',
      status: 'published',
      theme: 'default',
      backgroundColor: '#f9fafb',
      textColor: '#111827',
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
            }
          ],
          branching: []
        }
      ]
    };
  },

  /**
   * Generate sample analytics data
   */
  sampleAnalytics() {
    return {
      surveyId: 'test-survey-id',
      totalResponses: 25,
      questions: [
        {
          questionId: 'q1',
          type: 'singleChoice',
          title: 'How satisfied are you with our service?',
          totalResponses: 25,
          analytics: {
            type: 'choice',
            values: [
              { label: 'Very Satisfied', value: 10, percentage: 40 },
              { label: 'Satisfied', value: 8, percentage: 32 },
              { label: 'Neutral', value: 4, percentage: 16 },
              { label: 'Dissatisfied', value: 2, percentage: 8 },
              { label: 'Very Dissatisfied', value: 1, percentage: 4 }
            ]
          }
        }
      ]
    };
  }
};

/**
 * Common selectors for consistent testing
 */
export const Selectors = {
  // Authentication
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton: 'button[type="submit"]',
  loginButton: 'text=Log in',
  registerButton: 'text=Sign up',
  
  // Survey Builder
  surveyTitleInput: 'input[placeholder="Enter survey title"]',
  surveyDescriptionInput: 'input[placeholder="Describe your survey"]',
  saveButton: 'text=Save Survey',
  publishButton: 'text=Publish',
  addPageButton: 'text=+ Add Page',
  
  // Question Types
  singleChoice: '.question-type-item:has-text("Multiple choice")',
  multipleChoice: '.question-type-item:has-text("Checkboxes")',
  textShort: '.question-type-item:has-text("Short text")',
  textLong: '.question-type-item:has-text("Long text")',
  starRating: '.question-type-item:has-text("Star rating")',
  smileyRating: '.question-type-item:has-text("Smiley rating")',
  slider: '.question-type-item:has-text("Slider")',
  
  // Canvas
  canvasArea: '.col-span-6 .border-dashed',
  
  // Navigation
  nextButton: 'text=Next →',
  previousButton: 'text=← Previous',
  submitSurveyButton: 'text=Submit Survey',
  
  // Alerts
  errorAlert: '.alert-error, [role="alert"]',
  successAlert: '.alert-success, [role="alert"]',
  
  // Loading states
  loadingText: 'text=Loading..., text=Please wait..., text=Saving...'
};
