import log from '../logger';
import { TemplateRepository } from '../repository/template.repository';
import { SurveyRepository } from '../repository/survey.repository';
import { generateUniqueSlug } from '../utils/slug';

export class TemplateService {
  private readonly repo = new TemplateRepository();
  private readonly surveyRepo = new SurveyRepository();
  async listTemplates() {
    log.debug('Fetching all templates', 'listTemplates');
    const templates = await this.repo.findAll();
    log.debug('Templates retrieved', 'listTemplates', { count: templates.length });
    return templates;
  }

  async getTemplate(id: string) {
    log.debug('Fetching template by ID', 'getTemplate', { templateId: id });
    const template = await this.repo.findByPublicId(id);
    if (!template) {
      log.warn('Template not found', 'getTemplate', { templateId: id });
      throw new Error('Template not found');
    }
    log.debug('Template retrieved', 'getTemplate', { templateId: id, title: template.title });
    return template;
  }

  async instantiateTemplate(userId: string, id: string) {
    log.info('Instantiating template to survey', 'instantiateTemplate', { userId, templateId: id });
    const template = await this.getTemplate(id);
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
}


