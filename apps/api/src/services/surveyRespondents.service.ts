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
      // Merge with existing respondents and groups (don't replace)
      const existingRespondentIds = (surveyRespondents.allowedRespondents || []).map((id: any) => 
        typeof id === 'string' ? id : id.toString()
      );
      const existingGroupIds = (surveyRespondents.allowedGroups || []).map((id: any) => 
        typeof id === 'string' ? id : id.toString()
      );
      
      // Combine existing with new (deduplicated)
      const mergedRespondentIds = [...new Set([...existingRespondentIds, ...uniqueRespondentIds])];
      const mergedGroupIds = [...new Set([...existingGroupIds, ...uniqueGroupIds])];
      

      // Update existing entry with merged data
      surveyRespondents = await this.repo.update(surveyId, {
        allowedRespondents: mergedRespondentIds.map((id) => new mongoose.Types.ObjectId(id)),
        allowedGroups: mergedGroupIds.map((id) => new mongoose.Types.ObjectId(id)),
      });
    }

    // Expand groups to get all member IDs
    const allRespondentIds = new Set<string>(uniqueRespondentIds);

    // Also expand existing groups to get all member IDs
    const existingGroupIds = (surveyRespondents.allowedGroups || []).map((id: any) => {
      if (typeof id === 'string') return id;
      if (id && typeof id === 'object' && id._id) return id._id.toString();
      return id?.toString();
    }).filter(id => id && mongoose.Types.ObjectId.isValid(id));
    for (const groupId of existingGroupIds) {
      try {
        const group = await this.groupRepo.getById(groupId);
        if (group && group.members) {
          group.members.forEach((memberId: any) => {
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
          });
        }
      } catch (error) {
        log.warn('Failed to fetch existing group members', 'mergeRecipients', { groupId, error });
      }
    }

    for (const groupId of uniqueGroupIds) {
      try {
        const group = await this.groupRepo.getById(groupId);
        if (group && group.members) {
          group.members.forEach((memberId: any) => {
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
          });
        }
      } catch (error) {
        log.warn('Failed to fetch group members', 'mergeRecipients', { groupId, error });
      }
    }

    // Get existing invitations
    const existingInvitations = surveyRespondents.invitations || [];
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

    log.info('Recipients merged successfully', 'mergeRecipients', {
      surveyId,
      totalRespondents: allRespondentIds.size,
      invitationsCount: updatedInvitations.length,
    });

    // Check if survey is live or published and auto-trigger invitations
    try {
      const { Survey } = await import('../models/Survey');
      const { generateSurveyToken, sendSurveyInvite } = await import('../utils/email');
      const { Respondent } = await import('../models/Respondent');
      
      const survey = await Survey.findById(surveyId);
      if (survey && survey.status === 'live') {
        log.info('Survey is live, sending email invitations automatically', 'mergeRecipients', {
          surveyId,
          status: survey.status,
        });
        
        // Get new pending invitations
        const newInvitations = updatedInvitations.filter((inv: any) => inv.status === 'pending');
        
        // Send emails for new pending invitations
        let sentCount = 0;
        let failedCount = 0;
        
        for (const inv of newInvitations) {
          try {
            const respondentId = typeof inv.respondentId === 'object' && inv.respondentId !== null 
              ? (inv.respondentId as any).toString() 
              : inv.respondentId?.toString() || '';
            
            const respondent = await Respondent.findById(respondentId);
            if (!respondent || !respondent.mail) {
              failedCount++;
              continue;
            }
            
            // Generate token and send email
            const token = generateSurveyToken(surveyId, respondent.mail);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const surveyLink = `${frontendUrl}/s/${survey.slug}?token=${token}`;
            
            await sendSurveyInvite(respondent.mail, survey.title, surveyLink);
            
            // Update status to 'sent'
            await this.updateInvitationStatus(surveyId, respondentId, 'sent');
            sentCount++;
            
          } catch (error: any) {
            const respondentId = typeof inv.respondentId === 'object' && inv.respondentId !== null 
              ? (inv.respondentId as any).toString() 
              : inv.respondentId?.toString() || '';
            await this.updateInvitationStatus(surveyId, respondentId, 'failed');
            failedCount++;
          }
        }
      }
    } catch (error: any) {
      log.error('Failed to check survey status or send invitations', 'mergeRecipients', {
        surveyId,
        error: error.message,
      });
      // Don't throw - the invitations were created successfully
      // The job will pick them up later
    }

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

    // Add pending invitations for new respondents
    for (const respondentId of respondentIds) {
      await this.repo.addInvitation(surveyId, {
        respondentId: new mongoose.Types.ObjectId(respondentId),
        sentAt: new Date(),
        status: 'pending',
      });
    }

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

    const updated = await this.repo.removeGroups(surveyId, groupIds);

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

