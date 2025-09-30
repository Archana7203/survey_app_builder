import { config } from 'dotenv';
import { migrateSurveyLock } from '../utils/migrateSurveyLock';
import mongoose from 'mongoose';

// Load environment variables
config();

(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey_app';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const result = await migrateSurveyLock();
    console.log(`Migration completed. Updated ${result.migratedCount} surveys.`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
