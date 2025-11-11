import mongoose from 'mongoose';
import log from '../logger';
import { TemplateRepository } from '../repository/template.repository';
import { SurveyRepository } from '../repository/survey.repository';
import { generateUniqueSlug } from '../utils/slug';

export class TemplateService {
  private readonly repo = new TemplateRepository();
  private readonly surveyRepo = new SurveyRepository();
  async listTemplates(userId?: string) {
    log.debug('Fetching all templates', 'listTemplates', { userId: userId ?? 'public' });
    const templates = await this.repo.findAllForUser(userId);
    log.debug('Templates retrieved', 'listTemplates', { count: templates.length, userId: userId ?? 'public' });
    return templates;
  }

  async getTemplate(id: string, userId?: string) {
    log.debug('Fetching template by ID', 'getTemplate', { templateId: id, userId: userId ?? 'public' });
    const template = await this.repo.findByPublicId(id, userId);
    if (!template) {
      log.warn('Template not found', 'getTemplate', { templateId: id, userId: userId ?? 'public' });
      throw new Error('Template not found');
    }
    log.debug('Template retrieved', 'getTemplate', { templateId: id, title: template.title, userId: userId ?? 'public' });
    return template;
  }

  async instantiateTemplate(userId: string, id: string) {
    log.info('Instantiating template to survey', 'instantiateTemplate', { userId, templateId: id });
    const template = await this.getTemplate(id, userId);
    const slug = await generateUniqueSlug(template.title);   
    log.debug('Generated slug for template survey', 'instantiateTemplate', { userId, templateId: id, slug });
    const survey = await this.surveyRepo.createSurvey({
      title: template.title,
      description: template.description,
      slug,
      theme: 'default',
      status: 'draft',
      pages: template.pages,
      createdBy: userId,
    } as any);    
    log.info('Template instantiated successfully', 'instantiateTemplate', { 
      userId, 
      templateId: id, 
      surveyId: survey._id 
    });    
    return survey;
  }

  async ensureSamples(samples: any[]) {
    log.info('Ensuring sample templates', 'ensureSamples', { sampleCount: samples.length });
    await this.repo.upsertMany(samples);
    const ids = samples.map(s => s.id).filter(Boolean);
    const result = await this.repo.findManyByIds(ids);
    log.info('Sample templates ensured', 'ensureSamples', { 
      providedCount: samples.length, 
      savedCount: result.length 
    });
    return result;
  }

  async importTemplate(userId: string, payload: any) {
    log.info('Importing template', 'importTemplate', { userId });

    const templateData = payload?.template ?? payload?.survey ?? payload;

    if (!templateData || typeof templateData !== 'object') {
      log.warn('Invalid template payload', 'importTemplate', { userId });
      throw new Error('Invalid template data format');
    }

    const title = typeof templateData.title === 'string' ? templateData.title.trim() : '';
    if (!title) {
      log.warn('Template import validation failed: missing title', 'importTemplate', { userId });
      throw new Error('Template must include a title');
    }

    const description =
      typeof templateData.description === 'string'
        ? templateData.description.trim()
        : '';
    const category =
      typeof templateData.category === 'string' && templateData.category.trim()
        ? templateData.category.trim()
        : 'Custom';
    const thumbnail =
      typeof templateData.thumbnail === 'string' && templateData.thumbnail.trim()
        ? templateData.thumbnail.trim()
        : '🆕';
    const estimatedTime =
      typeof templateData.estimatedTime === 'string' && templateData.estimatedTime.trim()
        ? templateData.estimatedTime.trim()
        : '3-5 minutes';

    const pages = Array.isArray(templateData.pages) ? templateData.pages : [];

    const publicId = new mongoose.Types.ObjectId().toString();

    const created = await this.repo.createTemplate({
      id: publicId,
      title,
      description,
      category,
      thumbnail,
      estimatedTime,
      pages,
      createdBy: new mongoose.Types.ObjectId(userId) as any,
    });

    log.info('Template imported successfully', 'importTemplate', {
      userId,
      templateId: created.id,
      title: created.title,
    });

    return {
      id: created.id,
      title: created.title,
      description: created.description,
      category: created.category,
      thumbnail: created.thumbnail,
      estimatedTime: created.estimatedTime,
      pages: created.pages,
      createdBy: userId,
    };
  }

  async updateTemplate(
    userId: string,
    templateId: string,
    updates: { category?: string; estimatedTime?: string },
  ) {
    log.info('Updating template', 'updateTemplate', { userId, templateId });

    const updatePayload: Record<string, string> = {};

    if (updates.category !== undefined) {
      const category = typeof updates.category === 'string' ? updates.category.trim() : '';
      if (!category) {
        throw new Error('Category is required');
      }
      updatePayload.category = category;
    }

    if (updates.estimatedTime !== undefined) {
      const estimatedTime = typeof updates.estimatedTime === 'string' ? updates.estimatedTime.trim() : '';
      if (!estimatedTime) {
        throw new Error('Estimated time is required');
      }
      const normalized = estimatedTime.toLowerCase().endsWith('min')
        ? estimatedTime
        : `${estimatedTime} min`;
      updatePayload.estimatedTime = normalized;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new Error('No template fields provided for update');
    }

    const updated = await this.repo.updateTemplateForUser(templateId, userId, updatePayload);
    if (!updated) {
      log.warn('Template not found or not owned by user', 'updateTemplate', { userId, templateId });
      throw new Error('Template not found or you do not have permission to edit it');
    }

    log.info('Template updated successfully', 'updateTemplate', { userId, templateId });

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      thumbnail: updated.thumbnail,
      estimatedTime: updated.estimatedTime,
      pages: updated.pages,
      createdBy: updated.createdBy ? updated.createdBy.toString() : null,
    };
  }

  async deleteTemplate(userId: string, templateId: string) {
    log.info('Deleting template', 'deleteTemplate', { userId, templateId });

    const deleted = await this.repo.deleteTemplateForUser(templateId, userId);
    if (!deleted) {
      log.warn('Template not found or not owned by user', 'deleteTemplate', { userId, templateId });
      throw new Error('Template not found or you do not have permission to delete it');
    }

    log.info('Template deleted successfully', 'deleteTemplate', { userId, templateId });
  }
}


