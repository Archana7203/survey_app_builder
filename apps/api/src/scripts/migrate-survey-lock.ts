import mongoose from 'mongoose';
import { config } from 'dotenv';
import { migrateSurveyLock } from '../utils/migrateSurveyLock';

// Load environment variables
config();

async function main() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey_app';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Run migration
    const result = await migrateSurveyLock();
    console.log(`Migration completed. Updated ${result.migratedCount} surveys.`);

    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
