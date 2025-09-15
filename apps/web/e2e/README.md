# End-to-End Testing for Survey App Builder

This directory contains comprehensive end-to-end (E2E) tests for the Survey App Builder application using Playwright.

## Test Files Overview

### 1. Authentication Tests (`auth.e2e.spec.ts`)
Tests the complete authentication flow including:
- User registration (signup)
- User login
- User logout
- Form validation
- Error handling
- Loading states
- Accessibility features
- Keyboard navigation

### 2. Survey Creation Tests (`survey-creation.e2e.spec.ts`)
Tests the survey builder functionality including:
- Drag and drop question components
- Multiple page creation and management
- Question configuration (single choice, multiple choice, text, rating, slider, etc.)
- Question reordering
- Question deletion
- Survey saving and validation
- Theme application
- Preview functionality

### 3. Survey Publishing Tests (`survey-publishing.e2e.spec.ts`)
Tests survey publishing and management including:
- Publishing/unpublishing surveys
- Survey status management
- Survey link copying
- Template instantiation
- Survey duplication
- Survey import/export
- Survey deletion
- Mailing functionality
- Social media sharing

### 4. Survey Responding Tests (`survey-responding.e2e.spec.ts`)
Tests public survey response functionality including:
- Public survey loading
- Question answering (all types)
- Page navigation
- Progress indicators
- Auto-save functionality
- Form validation
- Theme application
- Branching logic
- Survey submission
- Thank you page

### 5. Analytics Tests (`analytics.e2e.spec.ts`)
Tests analytics and reporting functionality including:
- Analytics data display
- Chart rendering and interaction
- PDF export
- Data refresh
- Real-time updates via WebSocket
- Different chart types
- Filtering and date ranges
- Error handling

### 6. Respondent Progress Tests (`respondent-progress.e2e.spec.ts`)
Tests respondent progress tracking including:
- Progress statistics display
- Individual respondent details
- Progress filtering and search
- Real-time progress updates
- Export functionality
- Activity timelines
- Engagement metrics
- Bulk operations

## Running the Tests

### Prerequisites
1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Running All Tests
```bash
npx playwright test
```

### Running Specific Test Files
```bash
# Run authentication tests only
npx playwright test auth.e2e.spec.ts

# Run survey creation tests only
npx playwright test survey-creation.e2e.spec.ts

# Run survey publishing tests only
npx playwright test survey-publishing.e2e.spec.ts

# Run survey responding tests only
npx playwright test survey-responding.e2e.spec.ts

# Run analytics tests only
npx playwright test analytics.e2e.spec.ts

# Run respondent progress tests only
npx playwright test respondent-progress.e2e.spec.ts
```

### Running Tests in Different Browsers
```bash
# Run in Chrome only
npx playwright test --project=chromium

# Run in Firefox only
npx playwright test --project=firefox

# Run in Safari only
npx playwright test --project=webkit

# Run on mobile devices
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Running Tests in Headed Mode
```bash
# Run tests with browser UI visible
npx playwright test --headed

# Run specific test with browser UI
npx playwright test auth.e2e.spec.ts --headed
```

### Running Tests in Debug Mode
```bash
# Run tests in debug mode
npx playwright test --debug

# Debug specific test
npx playwright test auth.e2e.spec.ts --debug
```

## Test Configuration

The tests are configured in `playwright.config.ts` with the following features:

- **Parallel execution** for faster test runs
- **Automatic retries** on CI (2 retries)
- **Multiple browser support** (Chrome, Firefox, Safari)
- **Mobile device testing** (iPhone, Pixel)
- **Automatic screenshots** on failure
- **Video recording** on failure
- **Trace collection** for debugging
- **HTML report** generation
- **Global setup/teardown** for test environment

## Test Data and Mocking

The tests use comprehensive mocking to simulate:
- API responses for all endpoints
- Authentication states
- Survey data
- Analytics data
- Respondent progress data
- WebSocket connections
- File uploads/downloads

## Key Testing Features

### 1. Comprehensive Coverage
- All major user flows are tested
- Edge cases and error scenarios are covered
- Accessibility features are validated
- Cross-browser compatibility is ensured

### 2. Real User Interactions
- Drag and drop operations
- Form filling and validation
- Navigation between pages
- File uploads and downloads
- Keyboard navigation

### 3. Visual Testing
- Screenshots on failure
- Video recording for debugging
- Trace collection for detailed analysis

### 4. Performance Testing
- Page load times
- API response times
- Real-time update performance

## Debugging Tests

### View Test Results
```bash
# Open HTML report
npx playwright show-report
```

### Debug Failed Tests
```bash
# Run failed tests in debug mode
npx playwright test --debug --grep="failing test name"
```

### View Traces
```bash
# Open trace viewer
npx playwright show-trace test-results/trace.zip
```

## Continuous Integration

The tests are configured to run in CI environments with:
- Automatic browser installation
- Parallel test execution
- Retry logic for flaky tests
- Comprehensive reporting
- Artifact collection (screenshots, videos, traces)

## Best Practices

1. **Test Isolation**: Each test is independent and can run in any order
2. **Mocking**: External dependencies are mocked for reliable testing
3. **Wait Strategies**: Proper waiting for elements and network requests
4. **Error Handling**: Comprehensive error scenario testing
5. **Accessibility**: Keyboard navigation and screen reader compatibility
6. **Mobile Testing**: Responsive design validation across devices

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout values in config
2. **Element not found**: Check selectors and wait conditions
3. **Network issues**: Verify API mocking is working correctly
4. **Browser issues**: Update Playwright and browser versions

### Getting Help

- Check the [Playwright documentation](https://playwright.dev/docs/intro)
- Review test logs and screenshots in the HTML report
- Use the trace viewer for detailed debugging information
- Check the browser console for JavaScript errors

## Contributing

When adding new tests:
1. Follow the existing test structure and naming conventions
2. Add comprehensive mocking for new API endpoints
3. Include both positive and negative test cases
4. Test accessibility features
5. Add proper error handling
6. Update this README if adding new test categories


