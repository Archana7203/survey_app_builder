import mongoose from 'mongoose';
import { SurveyRespondents } from '../models/SurveyRespondents';
import { Survey } from '../models/Survey';
import { Respondent } from '../models/Respondent';
import { SurveyRespondentsRepository } from '../repository/surveyRespondents.repository';
import { generateSurveyToken, sendSurveyInvite } from '../utils/email';
import log from '../logger';

interface InvitationResult {
  surveyId: string;
  respondentId: string;
  email: string;
  success: boolean;
  error?: string;
}

/**
 * Job to send survey invitations to respondents with pending invitations
 * 
 * Features:
 * - Queries SurveyRespondents where invitations.status='pending'
 * - Sends emails via existing mail utility
 * - Updates status to 'sent' on success or 'failed' on error
 * - Duplicate sends prevented by (surveyId + respondentId) uniqueness in invitations array
 * 
 * Can be run as:
 * - Cron job (e.g., every 5 minutes)
 * - Manual trigger via admin endpoint
 * - Event-driven (e.g., on survey status change to 'live')
 */
export class SendSurveyInvitationsJob {
  private readonly repo = new SurveyRespondentsRepository();
  private batchSize = 10; // Process in batches to avoid overwhelming email service
  private onlySurveyId?: string;

  /**
   * Main job execution method
   */
  async execute(onlySurveyId?: string): Promise<{
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    results: InvitationResult[];
  }> {
    this.onlySurveyId = onlySurveyId;
    log.info('Starting SendSurveyInvitations job', 'SendSurveyInvitationsJob', { onlySurveyId: this.onlySurveyId });

    try {
      // Find all SurveyRespondents with pending invitations
      const pendingInvitations = await this.findPendingInvitations();

      if (pendingInvitations.length === 0) {
        log.info('No pending invitations found', 'SendSurveyInvitationsJob');
        return {
          totalProcessed: 0,
          successCount: 0,
          failedCount: 0,
          results: [],
        };
      }

      log.info('Found pending invitations', 'SendSurveyInvitationsJob', {
        count: pendingInvitations.length,
      });

      // Process invitations in batches
      const results: InvitationResult[] = [];
      for (let i = 0; i < pendingInvitations.length; i += this.batchSize) {
        const batch = pendingInvitations.slice(i, i + this.batchSize);
        const batchResults = await this.processBatch(batch);
        results.push(...batchResults);

        // Small delay between batches to avoid rate limiting
        if (i + this.batchSize < pendingInvitations.length) {
          await this.delay(1000); // 1 second delay
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      log.info('SendSurveyInvitations job completed', 'SendSurveyInvitationsJob', {
        totalProcessed: results.length,
        successCount,
        failedCount,
      });

      return {
        totalProcessed: results.length,
        successCount,
        failedCount,
        results,
      };
    } catch (error: any) {
      log.error('SendSurveyInvitations job failed', 'SendSurveyInvitationsJob', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Find all pending invitations across all surveys
   */
  private async findPendingInvitations(): Promise<
    Array<{
      surveyId: string;
      surveyTitle: string;
      surveySlug: string;
      respondentId: string;
      respondentEmail: string;
      respondentName: string;
    }>
  > {
    // Aggregate query to find all pending invitations with survey and respondent details
    const pipeline: any[] = [
      {
        // Unwind invitations array to process each invitation separately
        $unwind: '$invitations',
      },
      {
        // Filter for pending invitations only
        $match: {
          'invitations.status': 'pending',
        },
      },
    ];

    if (this.onlySurveyId) {
      pipeline.push({
        $match: { surveyId: new mongoose.Types.ObjectId(this.onlySurveyId) },
      });
    }

    pipeline.push(
      {
        // Join with Survey collection to get survey details
        $lookup: {
          from: 'surveys',
          localField: 'surveyId',
          foreignField: '_id',
          as: 'survey',
        },
      },
      {
        // Unwind survey array (should be single element)
        $unwind: '$survey',
      },
      {
        // Filter for active surveys only (live or published)
        $match: {
          'survey.status': { $in: ['live', 'published'] },
        },
      },
      {
        // Join with Respondent collection to get respondent details
        $lookup: {
          from: 'respondents',
          localField: 'invitations.respondentId',
          foreignField: '_id',
          as: 'respondent',
        },
      },
      {
        // Unwind respondent array (should be single element)
        $unwind: '$respondent',
      },
      {
        // Filter for active accounts only
        $match: {
          'respondent.accountEnabled': true,
          'respondent.isArchived': false,
        },
      },
      {
        // Project only needed fields
        $project: {
          surveyId: '$surveyId',
          surveyTitle: '$survey.title',
          surveySlug: '$survey.slug',
          respondentId: '$invitations.respondentId',
          respondentEmail: '$respondent.mail',
          respondentName: '$respondent.name',
        },
      }
    );

    const results = await SurveyRespondents.aggregate(pipeline);

    log.debug('Pending invitations query result', 'findPendingInvitations', {
      count: results.length,
    });

    return results.map((r) => ({
      surveyId: r.surveyId.toString(),
      surveyTitle: r.surveyTitle,
      surveySlug: r.surveySlug,
      respondentId: r.respondentId.toString(),
      respondentEmail: r.respondentEmail,
      respondentName: r.respondentName,
    }));
  }

  /**
   * Process a batch of invitations
   */
  private async processBatch(
    invitations: Array<{
      surveyId: string;
      surveyTitle: string;
      surveySlug: string;
      respondentId: string;
      respondentEmail: string;
      respondentName: string;
    }>
  ): Promise<InvitationResult[]> {
    log.info('Processing invitation batch', 'processBatch', {
      batchSize: invitations.length,
    });

    const results = await Promise.allSettled(
      invitations.map((invitation) => this.sendInvitation(invitation))
    );

    return results.map((result, index) => {
      const invitation = invitations[index];
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          surveyId: invitation.surveyId,
          respondentId: invitation.respondentId,
          email: invitation.respondentEmail,
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Send a single invitation
   */
  private async sendInvitation(invitation: {
    surveyId: string;
    surveyTitle: string;
    surveySlug: string;
    respondentId: string;
    respondentEmail: string;
    respondentName: string;
  }): Promise<InvitationResult> {
    const { surveyId, surveyTitle, surveySlug, respondentId, respondentEmail, respondentName } =
      invitation;

    log.debug('Sending invitation', 'sendInvitation', {
      surveyId,
      respondentId,
      email: respondentEmail,
    });

    try {
      // Generate survey token
      const token = generateSurveyToken(surveyId, respondentEmail);

      // Build survey link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const surveyLink = `${frontendUrl}/s/${surveySlug}?token=${token}`;

      // Send email
      await sendSurveyInvite(respondentEmail, surveyTitle, surveyLink);

      // Update invitation status to 'sent'
      await this.updateInvitationStatus(surveyId, respondentId, 'sent');

      log.info('Invitation sent successfully', 'sendInvitation', {
        surveyId,
        respondentId,
        email: respondentEmail,
      });

      return {
        surveyId,
        respondentId,
        email: respondentEmail,
        success: true,
      };
    } catch (error: any) {
      log.error('Failed to send invitation', 'sendInvitation', {
        surveyId,
        respondentId,
        email: respondentEmail,
        error: error.message,
      });

      // Update invitation status to 'failed'
      await this.updateInvitationStatus(surveyId, respondentId, 'failed');

      return {
        surveyId,
        respondentId,
        email: respondentEmail,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update invitation status and sentAt timestamp
   */
  private async updateInvitationStatus(
    surveyId: string,
    respondentId: string,
    status: 'sent' | 'failed'
  ): Promise<void> {
    try {
      await SurveyRespondents.updateOne(
        {
          surveyId: new mongoose.Types.ObjectId(surveyId),
          'invitations.respondentId': new mongoose.Types.ObjectId(respondentId),
        },
        {
          $set: {
            'invitations.$.status': status,
            'invitations.$.sentAt': new Date(),
          },
        }
      );

      log.debug('Invitation status updated', 'updateInvitationStatus', {
        surveyId,
        respondentId,
        status,
      });
    } catch (error: any) {
      log.error('Failed to update invitation status', 'updateInvitationStatus', {
        surveyId,
        respondentId,
        status,
        error: error.message,
      });
      // Don't throw - we don't want to fail the whole job if status update fails
      // The invitation will remain pending and be retried
    }
  }

  /**
   * Utility method to add delay between batches
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Set batch size for processing
   */
  setBatchSize(size: number): void {
    this.batchSize = Math.max(1, Math.min(size, 100)); // Between 1 and 100
  }
}

/**
 * Standalone execution function for running as a script
 */
export const runSendInvitationsJob = async (): Promise<void> => {
  const job = new SendSurveyInvitationsJob();

  try {
    const result = await job.execute();
  } catch (error: any) {
    console.error('Job execution failed:', error.message);
    throw error;
  }
};

// Allow running directly with ts-node
if (require.main === module) {
  const mongoose = require('mongoose');
  const dotenv = require('dotenv');

  dotenv.config();

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not configured');
    process.exit(1);
  }

  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log('Connected to MongoDB');
      await runSendInvitationsJob();
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    })
    .catch((error: any) => {
      console.error('Failed to run job:', error);
      process.exit(1);
    });
}

