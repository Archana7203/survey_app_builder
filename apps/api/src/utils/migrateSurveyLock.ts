import mongoose from 'mongoose';
import { Survey } from '../models/Survey';

export async function migrateSurveyLock() {
  try {
    console.log('Starting survey lock migration...');

    // Find all surveys that are or were published
    const surveys = await Survey.find({
      status: { $in: ['published', 'closed'] }
    });

    console.log(`Found ${surveys.length} surveys to update`);

    // Update each survey to set locked = true
    for (const survey of surveys) {
      survey.locked = true;
      // Set locked = true for all published or closed surveys
      await survey.save();
    }

    console.log('Migration completed successfully');
    return {
      success: true,
      migratedCount: surveys.length
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
