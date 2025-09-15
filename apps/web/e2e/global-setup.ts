import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');
  
  // Start browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Check if the application is running
    const title = await page.title();
    console.log(`✅ Application is running with title: ${title}`);
    
    // You can add any global setup logic here, such as:
    // - Creating test users
    // - Setting up test data
    // - Configuring test environment
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed');
}

export default globalSetup;


