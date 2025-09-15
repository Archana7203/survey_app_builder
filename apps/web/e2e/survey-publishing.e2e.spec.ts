import { test, expect } from '@playwright/test';

// Helper to perform registration (for E2E tests)
async function register(page) {
  await page.goto('/auth');
  await page.getByRole('button', { name: /Create an account/i }).click();
  const testEmail = `test-${Date.now()}@example.com`;
  await page.getByPlaceholder('you@example.com').fill(testEmail);
  await page.getByPlaceholder('••••••••').fill('TestPassword123!');
  await page.getByRole('button', { name: /Sign up/i }).click();
  await page.waitForURL('**/dashboard');
}
import { Buffer } from 'buffer';

test.describe('Survey Publishing and Management', () => {
  test.beforeEach(async ({ page }) => {
    // Always mock /api/surveys with query params support before any navigation or registration
    await page.route('**/api/surveys**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await register(page);
    await page.goto('/dashboard/surveys');
  });

  test('should display surveys list with correct information', async ({ page }) => {
    // Set up mock data BEFORE navigation
    await page.route('**/api/surveys**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              locked: true,
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.reload();
    // Check page header
    await expect(page.getByRole('heading', { name: /Surveys/i })).toBeVisible();
    await expect(page.getByText('Create and manage your surveys')).toBeVisible();
    // Check for create button (matches '+ Create Survey')
    await expect(page.getByRole('button', { name: '+ Create Survey' })).toBeVisible();
    // Wait for the survey table to be visible
    await expect(page.getByRole('table')).toBeVisible();
    // Check survey titles inside the table
    await expect(page.getByRole('table').getByText('Customer Satisfaction Survey')).toBeVisible();
    await expect(page.getByRole('table').getByText('Employee Feedback Survey')).toBeVisible();
    // Check status badges by visible text (scoped to table)
    await expect(page.getByRole('table').getByText('Draft')).toBeVisible();
    await expect(page.getByRole('table').getByText('Published')).toBeVisible();
    // Check for action buttons by emoji/title (mobile and desktop)
    // For draft survey row
    const draftRow = page.getByRole('row', { name: /Customer Satisfaction Survey/i });
    await expect(draftRow.getByRole('button', { name: '✏️' })).toBeVisible();
    // For published survey row
    const publishedRow = page.getByRole('row', { name: /Employee Feedback Survey/i });
    await expect(publishedRow.getByRole('button', { name: '✏️' })).toHaveCount(0);
    await expect(publishedRow.getByRole('button', { name: '🔍' })).toBeVisible();
    // View results and copy link buttons (still check first instance for presence)
    await expect(page.getByRole('table').getByRole('button', { name: '📊' }).first()).toBeVisible(); // View results
    await expect(page.getByRole('table').getByRole('button', { name: '📋', exact: true }).first()).toBeVisible(); // Copy link
  });

  test('should publish a draft survey', async ({ page }) => {
    await page.route('**/api/surveys', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              locked: true,
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    // Mock publish API to return published status
    await page.route('**/api/surveys/survey-1', async route => {
      if (route.request().method() === 'PUT') {
        // After publish, update the GET /api/surveys** mock to return correct statuses
        await page.route('**/api/surveys**', async route2 => {
          await route2.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              surveys: [
                {
                  id: 'survey-1',
                  title: 'Customer Satisfaction Survey',
                  status: 'published',
                  locked: true,
                  slug: 'customer-satisfaction',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                },
                {
                  id: 'survey-2',
                  title: 'Employee Feedback Survey',
                  status: 'published',
                  locked: true,
                  slug: 'employee-feedback',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              ],
              pagination: {
                page: 1,
                limit: 10,
                total: 2,
                totalPages: 1,
                hasNext: false,
                hasPrev: false
              }
            })
          });
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            survey: {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'published',
              locked: true,
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          })
        });
      } else {
        await route.continue();
      }
    });
    await page.goto('/dashboard/surveys');
    await expect(page.getByRole('table').getByText('Customer Satisfaction Survey')).toBeVisible();
    // Find the publish button by emoji (✅ for publish, 🚫 for unpublish)
    const publishButton = page.getByRole('button', { name: '✅' });
    await publishButton.click();
    // Wait for the status to update in the table
    await expect(
      page.getByRole('row', { name: /Customer Satisfaction Survey/i }).getByText('Published')
    ).toBeVisible();
    // After publishing, the edit button is replaced by view (🔍)
    const publishedRow = page.getByRole('row', { name: /Customer Satisfaction Survey/i });
    await expect(publishedRow.getByRole('button', { name: '🔍' })).toBeVisible();
    await expect(publishedRow.getByRole('button', { name: '✏️' })).toHaveCount(0);
  });

  test('should unpublish a published survey', async ({ page }) => {
    // Mock all /api/surveys** requests to include a published survey
    await page.route('**/api/surveys**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              locked: true,
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.goto('/dashboard/surveys');
    await expect(page.getByRole('button', { name: '🚫' })).toBeVisible();
    const unpublishButton = page.getByRole('button', { name: '🚫' });
    await unpublishButton.click();
    // After unpublish, update the mock to return Employee Feedback Survey as draft with closeDate in the past
    await page.route('**/api/surveys**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'draft',
              closeDate: '2000-01-01T00:00:00Z',
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.reload();
    await expect(page.getByRole('table').getByText('Employee Feedback Survey')).toBeVisible();
    const closedRow = page.getByRole('row', { name: /Employee Feedback Survey/i });
    await expect(page.getByRole('cell', { name: 'Closed', exact: true })).toBeVisible();
    await expect(closedRow.getByRole('button', { name: '✏️' })).toBeVisible();
  });

  test('should copy survey link to clipboard', async ({ page }) => {
    await page.route('**/api/surveys', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.goto('/dashboard/surveys');
    // Robust clipboard mock for Chromium
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, 'clipboard', {
        value: { writeText: () => Promise.resolve() },
        configurable: true
      });
    });

    // Find the copy link button by emoji (📋) in the draft survey row
    const copyButton = page.getByRole('row', { name: /Customer Satisfaction Survey/i }).getByRole('button', { name: '📋', exact: true });
    await copyButton.click();
    // Optionally, check for a toast or alert if your UI shows one
  });

  test('should handle publish/unpublish errors gracefully', async ({ page }) => {
    await page.route('**/api/surveys', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              locked: true,
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.goto('/dashboard/surveys');
    await page.goto('/dashboard/surveys');
    // Mock API error
    await page.route('**/api/surveys/survey-1', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to update survey status' })
        });
      } else {
        await route.continue();
      }
    });

    // Try to publish survey
    const publishButton = page.getByRole('button', { name: '✅' });
    await publishButton.click();
    // Check for error message (Alert component)
    await expect(page.getByText('Failed to update survey status')).toBeVisible();
  });

  test('should show loading state during publish/unpublish', async ({ page }) => {
    await page.route('**/api/surveys', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              locked: true,
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.goto('/dashboard/surveys');
    await page.goto('/dashboard/surveys');
    // Mock slow API response
    await page.route('**/api/surveys/survey-1', async route => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            survey: {
              id: 'survey-1',
              status: 'published',
              locked: true
            }
          })
        });
      } else {
        await route.continue();
      }
    });

    // Click publish button (✅)
    const publishButton = page.getByRole('button', { name: '✅' });
    await publishButton.click();
    // Check for loading state (⏳)
    await expect(page.getByRole('button', { name: '⏳' })).toBeVisible();
  });

  test('should create new survey from templates', async ({ page }) => {
    await page.route('**/api/templates', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'customer-satisfaction-template',
            title: 'Customer Satisfaction Template',
            description: 'A comprehensive customer satisfaction survey',
            category: 'Business',
            thumbnail: '📊',
            estimatedTime: '5 min'
          }
        ])
      });
    });
    await page.route('**/api/templates/customer-satisfaction-template/instantiate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-survey-id',
          title: 'Customer Satisfaction Template',
          description: 'A comprehensive customer satisfaction survey',
          pages: [{ questions: [] }]
        })
      });
    });
    await page.goto('/dashboard/templates');
    const useTemplateBtn = page.locator('button, a').filter({ hasText: 'Use This Template' }).first();
    await useTemplateBtn.waitFor({ state: 'visible', timeout: 20000 });
    await useTemplateBtn.click();
    // Wait for either navigation or builder heading
    await Promise.race([
      page.waitForURL('**/dashboard/surveys/new-survey-id/edit', { timeout: 45000 }),
      page.waitForSelector('h1, h2, h3:has-text("Survey Builder")', { timeout: 45000 })
    ]);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Survey Builder');
  });

  test('should duplicate existing survey', async ({ page }) => {
    await page.route('**/api/surveys**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              locked: true,
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.goto('/dashboard/surveys');
    const duplicateButton = page.getByRole('button', { name: '📄' }).first();
    await expect(duplicateButton).toBeVisible();
    await duplicateButton.click();
    await page.route('**/api/surveys**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              locked: true,
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'duplicated-survey-id',
              title: 'Customer Satisfaction Survey (Copy)',
              status: 'draft',
              slug: 'customer-satisfaction-copy',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 3,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.reload();
    await expect(page.getByRole('table').getByText('Customer Satisfaction Survey (Copy)')).toBeVisible();
  });

  test('should export survey to JSON file', async ({ page }) => {
    await page.route('**/api/surveys', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.goto('/dashboard/surveys');
    await page.goto('/dashboard/surveys');
    // Mock export API
    await page.route('**/api/surveys/survey-1/export', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Disposition': 'attachment; filename="customer-satisfaction-survey.json"'
        },
        body: JSON.stringify({
          id: 'survey-1',
          title: 'Customer Satisfaction Survey',
          description: 'A survey to measure customer satisfaction',
          pages: [{ questions: [] }]
        })
      });
    });

    // Find export button by emoji (📤)
    const exportButton = page.getByRole('button', { name: '📤' });
    await exportButton.click();
  });

  test('should import survey from JSON file', async ({ page }) => {
    await page.route('**/api/surveys**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              locked: true,
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.goto('/dashboard/surveys');
    const testFile = {
      name: 'test-survey.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        title: 'Imported Survey',
        description: 'Survey imported from file',
        pages: [{ questions: [] }]
      }))
    };
    await page.setInputFiles('input[type="file"]', testFile);
    await page.route('**/api/surveys**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              locked: true,
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'imported-survey-id',
              title: 'Imported Survey',
              status: 'draft',
              slug: 'imported-survey',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 3,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.reload();
    await expect(page.getByRole('table').getByText('Imported Survey')).toBeVisible();
  });

  test('should delete survey with confirmation', async ({ page }) => {
    await page.route('**/api/surveys', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              locked: true,
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.goto('/dashboard/surveys');
    await page.goto('/dashboard/surveys');
    // Mock delete API
    await page.route('**/api/surveys/survey-1', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.continue();
      }
    });

    // Find delete button by emoji (🗑️)
    const deleteButton = page.getByRole('button', { name: '🗑️' });
    await deleteButton.click();
    // Handle confirmation dialog (if present)
    // Optionally, check for alert or toast
  });

  test('should handle survey pagination', async ({ page }) => {
    await page.route('**/api/surveys', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: [
            {
              id: 'survey-1',
              title: 'Customer Satisfaction Survey',
              status: 'draft',
              slug: 'customer-satisfaction',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'survey-2',
              title: 'Employee Feedback Survey',
              status: 'published',
              locked: true,
              slug: 'employee-feedback',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      });
    });
    await page.goto('/dashboard/surveys');
    await page.goto('/dashboard/surveys');
    // Mock paginated surveys
    await page.route('**/api/surveys*', async route => {
      const url = new URL(route.request().url());
      const pageNum = url.searchParams.get('page') || '1';
      const limit = url.searchParams.get('limit') || '5';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surveys: Array.from({ length: parseInt(limit) }, (_, i) => ({
            id: `survey-${pageNum}-${i}`,
            title: `Survey ${pageNum}-${i}`,
            status: 'draft',
            createdAt: '2024-01-01T00:00:00Z'
          })),
          pagination: {
            page: parseInt(pageNum),
            limit: parseInt(limit),
            total: 15,
            totalPages: 3,
            hasNext: parseInt(pageNum) < 3,
            hasPrev: parseInt(pageNum) > 1
          }
        })
      });
    });

    // Reload page to get paginated data
    await page.reload();

    // Check pagination controls
    await expect(page.getByRole('button', { name: '← Previous' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next →' })).toBeVisible();
    // Click next page
    await page.getByRole('button', { name: 'Next →' }).click();
    // Verify page 2 is loaded
    await expect(page.getByRole('table').getByText('Survey 2-0')).toBeVisible();
  });

  test('should show survey statistics in overview', async ({ page }) => {
    // Navigate to overview
    await page.goto('/dashboard');

    // Mock overview data
    await page.route('**/api/surveys', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', status: 'published' },
          { id: '2', status: 'draft' },
          { id: '3', status: 'published' }
        ])
      });
    });

    await page.route('**/api/templates', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1' }, { id: '2' }
        ])
      });
    });

    await page.route('**/api/responses', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalResponses: 25,
          completedResponses: 20,
          recentResponses: []
        })
      });
    });

    // Check statistics cards
    await expect(page.locator('text=Total Surveys')).toBeVisible();
    await expect(page.locator('text=Published Surveys')).toBeVisible();
    await expect(page.locator('text=Total Responses')).toBeVisible();
    await expect(page.getByText('Templates', { exact: true })).toBeVisible();
  });
});


