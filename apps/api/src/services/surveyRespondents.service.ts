import { SurveyRespondentsRepository } from '../repository/surveyRespondents.repository';
import { RespondentGroupRepository } from '../repository/respondentGroup.repository';
import { IInvitation } from '../models/SurveyRespondents';
import mongoose from 'mongoose';
import log from '../logger';

export class SurveyRespondentsService {
  private readonly repo = new SurveyRespondentsRepository();
  private readonly groupRepo = new RespondentGroupRepository();

  /**
   * Get survey respondents by survey ID
   */
  async getBySurveyId(surveyId: string) {
    log.debug('Fetching survey respondents', 'getBySurveyId', { surveyId });
    const surveyRespondents = await this.repo.getBySurveyId(surveyId);

    if (!surveyRespondents) {
      log.debug('No respondents found for survey', 'getBySurveyId', { surveyId });
      return null;
    }

    return surveyRespondents;
  }

  /**
   * Get survey respondents by survey ID (IDs only, no population)
   */
  async getBySurveyIdIdsOnly(surveyId: string) {
    log.debug('Fetching survey respondents (IDs only)', 'getBySurveyIdIdsOnly', { surveyId });
    const surveyRespondents = await this.repo.getBySurveyIdIdsOnly(surveyId);

    if (!surveyRespondents) {
      log.debug('No respondents found for survey', 'getBySurveyIdIdsOnly', { surveyId });
      return null;
    }

    return surveyRespondents;
  }

  /**
   * Merge recipients: combines respondent IDs and group IDs
   * Deduplicates and updates invitations array with status=pending
   */
  async mergeRecipients(
    surveyId: string,
    respondentIds: string[],
    groupIds: string[]
  ) {
    log.info('Merging recipients for survey', 'mergeRecipients', {
      surveyId,
      respondentCount: respondentIds.length,
      groupCount: groupIds.length,
    });

    // Validate survey ID
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      throw new Error('Invalid survey ID');
    }

    // Deduplicate and validate input IDs
    const uniqueRespondentIds = [...new Set(respondentIds)].filter(id => 
      id && typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)
    );
    const uniqueGroupIds = [...new Set(groupIds)].filter(id => 
      id && typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)
    );


    // Get existing survey respondents or create new
    let surveyRespondents = await this.repo.getBySurveyIdIdsOnly(surveyId);
    

    if (!surveyRespondents) {
      // Create new survey respondents entry
      surveyRespondents = await this.repo.create({
        surveyId: new mongoose.Types.ObjectId(surveyId),
        allowedRespondents: uniqueRespondentIds.map((id) => new mongoose.Types.ObjectId(id)),
        allowedGroups: uniqueGroupIds.map((id) => new mongoose.Types.ObjectId(id)),
        invitations: [],
      });
    } else {
      // REPLACE existing respondents and groups with new data
      await this.repo.update(surveyId, {
        allowedRespondents: uniqueRespondentIds.map((id) => new mongoose.Types.ObjectId(id)),
        allowedGroups: uniqueGroupIds.map((id) => new mongoose.Types.ObjectId(id)),
      });
      // Re-fetch to get the invitations array (update doesn't return it)
      surveyRespondents = await this.repo.getBySurveyIdIdsOnly(surveyId);
      if (!surveyRespondents) {
        throw new Error('Failed to fetch survey respondents after update');
      }
    }

    // Expand groups to get all member IDs
    const allRespondentIds = new Set<string>(uniqueRespondentIds);

    // Expand groups from the updated surveyRespondents to get all member IDs
    const allGroupIds = uniqueGroupIds;
    if (allGroupIds.length > 0) {
      try {
        const { RespondentGroup } = await import('../models/RespondentGroup');
        const groups = await RespondentGroup.find({ _id: { $in: allGroupIds } }).select('members');
        for (const group of groups) {
          const members = (group as any).members || [];
          for (const memberId of members) {
            let memberIdStr: string;
            if (typeof memberId === 'string') {
              memberIdStr = memberId;
            } else if (memberId && typeof memberId === 'object' && memberId._id) {
              memberIdStr = memberId._id.toString();
            } else {
              memberIdStr = memberId?.toString();
            }
            if (memberIdStr && mongoose.Types.ObjectId.isValid(memberIdStr)) {
              allRespondentIds.add(memberIdStr);
            }
          }
        }
      } catch (error) {
        log.warn('Failed to bulk fetch group members', 'mergeRecipients', { error });
      }
    }

    // Get existing invitations
    const existingInvitations = (surveyRespondents?.invitations || []) as IInvitation[];
    const existingInvitationMap = new Map(
      existingInvitations.map((inv: any) => [inv.respondentId.toString(), inv])
    );

    // Create invitations for all respondents (deduped)
    const updatedInvitations: IInvitation[] = [];
    for (const respondentId of allRespondentIds) {
      // Validate respondent ID before creating invitation
      if (!mongoose.Types.ObjectId.isValid(respondentId)) {
        log.warn('Skipping invalid respondent ID', 'mergeRecipients', { respondentId });
        continue;
      }

      const existing = existingInvitationMap.get(respondentId);
      if (existing) {
        // Keep existing invitation
        updatedInvitations.push(existing);
      } else {
        // Add new invitation with status=pending (no sentAt date for pending)
        updatedInvitations.push({
          respondentId: new mongoose.Types.ObjectId(respondentId),
          status: 'pending',
        });
      }
    }

    // Update invitations in database
    const updated = await this.repo.update(surveyId, {
      invitations: updatedInvitations,
    });

    log.info('Recipients updated successfully', 'mergeRecipients', {
      surveyId,
      totalRespondents: allRespondentIds.size,
      invitationsCount: updatedInvitations.length,
    });

    return updated;
  }

  /**
   * Add respondents to survey
   */
  async addRespondents(surveyId: string, respondentIds: string[]) {
    log.info('Adding respondents to survey', 'addRespondents', {
      surveyId,
      count: respondentIds.length,
    });

    if (!respondentIds || respondentIds.length === 0) {
      throw new Error('No respondent IDs provided');
    }

    const updated = await this.repo.addRespondents(surveyId, respondentIds);

    log.info('Respondents added successfully', 'addRespondents', {
      surveyId,
    });

    return updated;
  }

  /**
   * Remove respondents from survey
   */
  async removeRespondents(surveyId: string, respondentIds: string[]) {
    log.info('Removing respondents from survey', 'removeRespondents', {
      surveyId,
      count: respondentIds.length,
    });

    if (!respondentIds || respondentIds.length === 0) {
      throw new Error('No respondent IDs provided');
    }

    const updated = await this.repo.removeRespondents(surveyId, respondentIds);

    log.info('Respondents removed successfully', 'removeRespondents', {
      surveyId,
    });

    return updated;
  }

  /**
   * Add groups to survey
   */
  async addGroups(surveyId: string, groupIds: string[]) {
    log.info('Adding groups to survey', 'addGroups', {
      surveyId,
      count: groupIds.length,
    });

    if (!groupIds || groupIds.length === 0) {
      throw new Error('No group IDs provided');
    }

    const updated = await this.repo.addGroups(surveyId, groupIds);

    log.info('Groups added successfully', 'addGroups', {
      surveyId,
    });

    return updated;
  }

  /**
   * Remove groups from survey
   */
  async removeGroups(surveyId: string, groupIds: string[]) {
    log.info('Removing groups from survey', 'removeGroups', {
      surveyId,
      count: groupIds.length,
    });

    if (!groupIds || groupIds.length === 0) {
      throw new Error('No group IDs provided');
    }

    // First, get all member IDs from the groups being removed
    const memberIdsToRemove = new Set<string>();
    for (const groupId of groupIds) {
      try {
        const group = await this.groupRepo.getById(groupId);
        if (group && group.members && group.members.length > 0) {
          const memberIds = group.members.map((id: any) => {
            if (typeof id === 'string') return id;
            if (id && typeof id === 'object' && id._id) return id._id.toString();
            return id?.toString();
          }).filter(id => id && mongoose.Types.ObjectId.isValid(id));
          
          for (const memberId of memberIds) {
            memberIdsToRemove.add(memberId);
          }
        }
      } catch (error) {
        log.warn('Failed to fetch group members for removal', 'removeGroups', { groupId, error });
      }
    }

    // Remove the groups
    const updated = await this.repo.removeGroups(surveyId, groupIds);

    // Remove invitations for the members of removed groups
    if (memberIdsToRemove.size > 0) {
      await this.repo.removeInvitationsByRespondentIds(surveyId, Array.from(memberIdsToRemove));
      log.info('Removed invitations for group members', 'removeGroups', {
        surveyId,
        removedMemberCount: memberIdsToRemove.size,
      });
    }

    log.info('Groups removed successfully', 'removeGroups', {
      surveyId,
    });

    return updated;
  }

  /**
   * Update invitation status
   */
  async updateInvitationStatus(
    surveyId: string,
    respondentId: string,
    status: 'pending' | 'sent' | 'failed'
  ) {
    log.info('Updating invitation status', 'updateInvitationStatus', {
      surveyId,
      respondentId,
      status,
    });

    const updated = await this.repo.updateInvitationStatus(surveyId, respondentId, status);

    log.info('Invitation status updated', 'updateInvitationStatus', {
      surveyId,
      respondentId,
      status,
    });

    return updated;
  }

  /**
   * Get all invitations for a survey
   */
  async getInvitations(surveyId: string) {
    log.debug('Fetching invitations', 'getInvitations', { surveyId });
    return this.repo.getInvitations(surveyId);
  }

  /**
   * Send pending invitations for a survey with limited concurrency
   */
  async sendPendingInvitations(surveyId: string, concurrency = 5) {
    log.info('Sending pending invitations', 'sendPendingInvitations', { surveyId, concurrency });
    const { Survey } = await import('../models/Survey');
    const { Respondent } = await import('../models/Respondent');
    const { generateSurveyToken, sendSurveyInvite } = await import('../utils/email');

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    // Get currently allowed respondent IDs
    const surveyRespondents = await this.repo.getBySurveyIdIdsOnly(surveyId);
    if (!surveyRespondents) {
      return { sent: 0, failed: 0, total: 0 };
    }

    const allowedRespondentIds = new Set(
      (surveyRespondents.allowedRespondents || []).map((id: any) => 
        typeof id === 'string' ? id : id.toString()
      )
    );

    // Expand groups to get all allowed member IDs
    const allAllowedRespondentIds = new Set(allowedRespondentIds);
    if (surveyRespondents.allowedGroups && surveyRespondents.allowedGroups.length > 0) {
      const groupIds = surveyRespondents.allowedGroups.map((id: any) => {
        if (typeof id === 'string') return id;
        if (id && typeof id === 'object' && id._id) return id._id.toString();
        return id?.toString();
      }).filter(id => id && mongoose.Types.ObjectId.isValid(id));

      try {
        const { RespondentGroup } = await import('../models/RespondentGroup');
        const groups = await RespondentGroup.find({ _id: { $in: groupIds } }).select('members');
        for (const group of groups) {
          const members = (group as any).members || [];
          for (const memberId of members) {
            let memberIdStr: string;
            if (typeof memberId === 'string') {
              memberIdStr = memberId;
            } else if (memberId && typeof memberId === 'object' && memberId._id) {
              memberIdStr = memberId._id.toString();
            } else {
              memberIdStr = memberId?.toString();
            }
            if (memberIdStr && mongoose.Types.ObjectId.isValid(memberIdStr)) {
              allAllowedRespondentIds.add(memberIdStr);
            }
          }
        }
      } catch (error) {
        log.warn('Failed to fetch group members', 'sendPendingInvitations', { error });
      }
    }

    // Check for completed survey responses - don't send to those who already completed
    const { Response } = await import('../models/Response');
    const completedResponses = await Response.find({
      survey: surveyId,
      status: 'Completed'
    }).select('respondentEmail');
    const completedEmails = new Set(
      completedResponses.map(r => r.respondentEmail?.toLowerCase()).filter(Boolean)
    );

    // Load invitations and filter to only pending invitations for currently allowed respondents
    const invitations = await this.repo.getInvitations(surveyId);
    const pending = (invitations || []).filter((inv: any) => {
      const respondentId = typeof inv.respondentId === 'object' && inv.respondentId !== null
        ? (inv.respondentId as any)._id?.toString?.() || (inv.respondentId as any).toString()
        : inv.respondentId?.toString() || '';
      
      // Only include if status is pending AND respondent is currently allowed
      return inv.status === 'pending' && allAllowedRespondentIds.has(respondentId);
    });

    if (pending.length === 0) {
      return { sent: 0, failed: 0, total: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Simple pool
    const pool: Promise<void>[] = [];
    const runTask = async (inv: any) => {
      try {
        const respondentId = typeof inv.respondentId === 'object' && inv.respondentId !== null
          ? (inv.respondentId as any)._id?.toString?.() || (inv.respondentId as any).toString()
          : inv.respondentId?.toString() || '';
        if (!respondentId) throw new Error('Invalid respondentId');
        const respondent = await Respondent.findById(respondentId).select('mail');
        if (!respondent?.mail) throw new Error('Respondent email missing');

        // Skip if respondent has already completed the survey
        const emailLower = String(respondent.mail).toLowerCase();
        if (completedEmails.has(emailLower)) {
          log.debug('Skipping invitation - respondent already completed survey', 'sendPendingInvitations', {
            surveyId,
            respondentId,
            email: respondent.mail
          });
          // Update invitation status to 'sent' to prevent retries (they completed, so no need to send)
          await this.updateInvitationStatus(surveyId, respondentId, 'sent');
          return;
        }

        const token = generateSurveyToken(surveyId, respondent.mail);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const surveyLink = `${frontendUrl}/s/${survey.slug}?token=${token}`;
        await sendSurveyInvite(respondent.mail, survey.title, surveyLink);
        await this.updateInvitationStatus(surveyId, respondentId, 'sent');
        sent++;
      } catch (e) {
        try {
          const respondentId = typeof inv.respondentId === 'object' && inv.respondentId !== null
            ? (inv.respondentId as any)._id?.toString?.() || (inv.respondentId as any).toString()
            : inv.respondentId?.toString() || '';
          if (respondentId) await this.updateInvitationStatus(surveyId, respondentId, 'failed');
        } catch {}
        failed++;
      }
    };

    let index = 0;
    const runNext = async (): Promise<void> => {
      if (index >= pending.length) return;
      const current = pending[index++];
      await runTask(current);
      return runNext();
    };
    const workers = Array.from({ length: Math.min(concurrency, pending.length) }, () => runNext());
    await Promise.all(workers);

    log.info('Invitation sending completed', 'sendPendingInvitations', { surveyId, sent, failed, total: pending.length });
    return { sent, failed, total: pending.length };
  }

  /**
   * Count respondents for a survey
   */
  async countRespondents(surveyId: string) {
    log.debug('Counting respondents', 'countRespondents', { surveyId });
    return this.repo.countRespondents(surveyId);
  }

  /**
   * Count groups for a survey
   */
  async countGroups(surveyId: string) {
    log.debug('Counting groups', 'countGroups', { surveyId });
    return this.repo.countGroups(surveyId);
  }

  /**
   * Delete survey respondents entry when survey is deleted
   */
  async deleteBySurveyId(surveyId: string) {
    log.info('Deleting survey respondents entry', 'deleteBySurveyId', { surveyId });
    await this.repo.deleteBySurveyId(surveyId);
    log.info('Survey respondents entry deleted', 'deleteBySurveyId', { surveyId });
  }

  /**
   * Get all respondent emails (including from groups) for a survey
   * Useful for sending invitations
   */
  async getAllRespondentEmails(surveyId: string): Promise<string[]> {
    log.debug('Getting all respondent emails', 'getAllRespondentEmails', { surveyId });

    const surveyRespondents = await this.repo.getBySurveyIdIdsOnly(surveyId);
    if (!surveyRespondents) {
      return [];
    }

    const emails = new Set<string>();

    // Get direct respondent emails
    if (surveyRespondents.allowedRespondents && surveyRespondents.allowedRespondents.length > 0) {
      const respondentIds = surveyRespondents.allowedRespondents.map((id: any) => 
        typeof id === 'string' ? id : id.toString()
      );
      
      const respondents = await this.repo.getRespondentsByIds(respondentIds);
      for (const respondent of respondents) {
        if (respondent.mail) {
          emails.add(respondent.mail);
        }
      }
    }

    // Get group member emails
    if (surveyRespondents.allowedGroups && surveyRespondents.allowedGroups.length > 0) {
      const groupIds = surveyRespondents.allowedGroups.map((id: any) => {
        if (typeof id === 'string') return id;
        if (id && typeof id === 'object' && id._id) return id._id.toString();
        return id?.toString();
      }).filter(id => id && mongoose.Types.ObjectId.isValid(id));
      
      for (const groupId of groupIds) {
        try {
          const group = await this.groupRepo.getById(groupId);
          if (group && group.members && group.members.length > 0) {
            const memberIds = group.members.map((id: any) => {
              if (typeof id === 'string') return id;
              if (id && typeof id === 'object' && id._id) return id._id.toString();
              return id?.toString();
            }).filter(id => id && mongoose.Types.ObjectId.isValid(id));
            
            const members = await this.repo.getRespondentsByIds(memberIds);
            for (const member of members) {
              if (member.mail) {
                emails.add(member.mail);
              }
            }
          }
        } catch (error) {
          log.warn('Failed to fetch group members', 'getAllRespondentEmails', { groupId, error });
        }
      }
    }


    return Array.from(emails);
  }
}

