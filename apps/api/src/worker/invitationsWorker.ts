import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import log from '../logger';
import { Job } from '../models/Job';
import { SendSurveyInvitationsJob } from '../jobs/sendSurveyInvitations.job';

async function processNextJob(): Promise<void> {
  const jobDoc = await Job.findOneAndUpdate(
    { type: 'send_invitations', status: 'queued' },
    { $set: { status: 'in_progress', startedAt: new Date() } },
    { new: true }
  );

  if (!jobDoc) return; // no queued jobs

  try {
    const job = new SendSurveyInvitationsJob();
    const result = await job.execute(jobDoc.surveyId?.toString());
    await Job.findByIdAndUpdate(jobDoc._id, {
      $set: {
        status: 'completed',
        finishedAt: new Date(),
        progress: {
          total: result.totalProcessed,
          processed: result.totalProcessed,
          success: result.successCount,
          failed: result.failedCount,
        },
      },
    });
    log.info('Background job completed', 'invitationsWorker', { jobId: (jobDoc as any)._id.toString() });
  } catch (e: any) {
    await Job.findByIdAndUpdate(jobDoc._id, {
      $set: { status: 'failed', finishedAt: new Date(), error: e?.message || String(e) },
    });
    log.error('Background job failed', 'invitationsWorker', { jobId: (jobDoc as any)._id.toString(), error: e?.message });
  }
}

async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    // eslint-disable-next-line no-console
    console.error('MONGODB_URI not configured');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  log.info('Worker connected to MongoDB', 'invitationsWorker');

  // Poll every 2 seconds
  setInterval(() => {
    processNextJob().catch((e) => {
      log.error('processNextJob error', 'invitationsWorker', { error: e?.message });
    });
  }, 2000);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Worker failed to start', e);
  process.exit(1);
});


