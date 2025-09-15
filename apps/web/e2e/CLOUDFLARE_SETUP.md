# Running E2E Tests with Cloudflare URLs

This guide explains how to configure and run your e2e tests against Cloudflare-hosted applications (Cloudflare Pages for frontend and Cloudflare Workers for backend).

## Configuration Changes Made

### 1. Playwright Configuration (`playwright.config.ts`)

The configuration has been updated to support environment variables:

- **`baseURL`**: Now uses `process.env.FRONTEND_URL` or defaults to localhost
- **Timeouts**: Increased for cloud latency (15s action, 45s navigation, 60s test)
- **WebServer**: Only starts local server if `FRONTEND_URL` is not set
- **Headers**: Added User-Agent header for better request identification

### 2. Environment Variables

Create a `.env` file in your project root with:

```bash
# Frontend URL (Cloudflare Pages)
FRONTEND_URL=https://your-app.pages.dev

# Backend API URL (Cloudflare Workers)
BACKEND_URL=https://your-api.your-domain.workers.dev
```

### 3. Package.json Scripts

New scripts added for different environments:

```bash
# Test against cloud URLs
npm run test:e2e:cloud

# Test against staging environment
npm run test:e2e:staging

# Test against production environment
npm run test:e2e:production
```

## Setting Up Cloudflare URLs

### Frontend (Cloudflare Pages)

1. **Deploy your React app to Cloudflare Pages:**
   ```bash
   # Build your app
   npm run build
   
   # Deploy to Cloudflare Pages (using Wrangler CLI)
   npx wrangler pages deploy dist
   ```

2. **Get your Pages URL:**
   - Go to Cloudflare Dashboard → Pages
   - Find your project and copy the URL (e.g., `https://your-app.pages.dev`)

### Backend (Cloudflare Workers)

1. **Deploy your API to Cloudflare Workers:**
   ```bash
   # Deploy using Wrangler CLI
   npx wrangler deploy
   ```

2. **Get your Workers URL:**
   - Go to Cloudflare Dashboard → Workers & Pages
   - Find your worker and copy the URL (e.g., `https://your-api.your-domain.workers.dev`)

## Running Tests

### Local Testing with Cloudflare URLs

1. **Set environment variables:**
   ```bash
   export FRONTEND_URL=https://your-app.pages.dev
   export BACKEND_URL=https://your-api.your-domain.workers.dev
   ```

2. **Run tests:**
   ```bash
   npm run test:e2e
   ```

### Using npm Scripts

```bash
# Test against your cloud deployment
npm run test:e2e:cloud

# Test against staging
npm run test:e2e:staging

# Test against production
npm run test:e2e:production
```

### Direct Environment Variable Usage

```bash
# Run specific test file against cloud
FRONTEND_URL=https://your-app.pages.dev BACKEND_URL=https://your-api.your-domain.workers.dev npx playwright test auth.e2e.spec.ts

# Run with UI for debugging
FRONTEND_URL=https://your-app.pages.dev BACKEND_URL=https://your-api.your-domain.workers.dev npx playwright test --ui
```

## CI/CD Configuration

### GitHub Actions

The workflow has been updated to support environment variables:

1. **Set repository variables:**
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add repository variables:
     - `FRONTEND_URL`: `https://your-app.pages.dev`
     - `BACKEND_URL`: `https://your-api.your-domain.workers.dev`

2. **The workflow will automatically:**
   - Use cloud URLs if environment variables are set
   - Skip local server startup if using cloud URLs
   - Pass environment variables to test runs

### Other CI/CD Platforms

For other platforms, set the environment variables:

```yaml
# Example for GitLab CI
variables:
  FRONTEND_URL: "https://your-app.pages.dev"
  BACKEND_URL: "https://your-api.your-domain.workers.dev"
```

## Test Utilities Updates

The `TestUtils` class has been updated to:

- **Auto-detect backend URL** from environment variables
- **Route API calls** to the configured backend URL
- **Handle cloud-specific configurations**

### Using TestUtils with Cloudflare

```typescript
import { TestUtils } from './test-utils';

test('example test', async ({ page }) => {
  const utils = new TestUtils(page);
  
  // Mock API calls to use your Cloudflare backend
  await utils.mockApiCalls();
  
  // Your test code here
});
```

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure your Cloudflare Workers API has proper CORS headers
   - Add your frontend domain to allowed origins

2. **Timeout Issues:**
   - Cloudflare can have higher latency
   - Timeouts have been increased in the config
   - Consider using `--timeout` flag for specific tests

3. **Authentication Issues:**
   - Ensure your Cloudflare Workers API handles authentication properly
   - Check that cookies and sessions work across domains

4. **Environment Variable Issues:**
   - Verify environment variables are set correctly
   - Use `console.log(process.env.FRONTEND_URL)` to debug

### Debug Mode

Run tests in debug mode to see what's happening:

```bash
FRONTEND_URL=https://your-app.pages.dev BACKEND_URL=https://your-api.your-domain.workers.dev npx playwright test --debug
```

### Network Issues

If you encounter network issues:

1. **Check Cloudflare status:**
   - Visit [Cloudflare Status](https://www.cloudflarestatus.com/)

2. **Verify URLs:**
   - Test your URLs in a browser
   - Check API endpoints with curl or Postman

3. **Check DNS:**
   - Ensure your domains resolve correctly
   - Verify SSL certificates are valid

## Best Practices

### 1. Environment Management

- Use different URLs for different environments
- Keep production URLs secure
- Use staging environments for testing

### 2. Test Data

- Use test-specific data for cloud testing
- Clean up test data after runs
- Use unique identifiers to avoid conflicts

### 3. Performance

- Cloudflare provides good performance globally
- Consider geographic distribution for tests
- Monitor test execution times

### 4. Security

- Don't commit production URLs to version control
- Use environment variables for sensitive URLs
- Implement proper authentication in your APIs

## Example Configuration

### Complete `.env` file:

```bash
# Development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001

# Staging
# FRONTEND_URL=https://staging.your-app.com
# BACKEND_URL=https://api-staging.your-app.com

# Production
# FRONTEND_URL=https://your-app.com
# BACKEND_URL=https://api.your-app.com

# Cloudflare
# FRONTEND_URL=https://your-app.pages.dev
# BACKEND_URL=https://your-api.your-domain.workers.dev
```

### GitHub Actions Variables:

```
FRONTEND_URL = https://your-app.pages.dev
BACKEND_URL = https://your-api.your-domain.workers.dev
```

This setup allows you to seamlessly test your application across different environments while maintaining the flexibility to run tests locally when needed.


