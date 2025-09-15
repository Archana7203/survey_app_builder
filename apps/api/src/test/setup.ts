import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import mongoose from 'mongoose'

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
process.env.MONGODB_URI = 'mongodb://localhost:27017/survey-app-test'

// Global test setup
beforeAll(async () => {
  // Connect to test database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!)
  }
  
  // Ensure indexes are created for unique constraints
  const { Survey } = await import('../models/Survey')
  try {
    // Wait for the model to be ready
    await new Promise(resolve => setTimeout(resolve, 100))
    await Survey.collection.createIndex({ slug: 1 }, { unique: true })
    console.log('Unique index created successfully')
  } catch (error: any) {
    // Index might already exist, that's okay
    console.log('Index creation skipped:', error.message)
  }
})

// Note: Individual test suites handle their own data setup/cleanup.
// Avoid global per-test cleanup to prevent cross-suite race conditions.

// Global test teardown
afterAll(async () => {
  // Close database connection
  await mongoose.connection.close()
})

// Mock console methods to reduce noise in tests
const originalConsole = console
beforeEach(() => {
  console.log = vi.fn()
  console.warn = vi.fn()
  console.error = vi.fn()
})

afterEach(() => {
  console.log = originalConsole.log
  console.warn = originalConsole.warn
  console.error = originalConsole.error
})
