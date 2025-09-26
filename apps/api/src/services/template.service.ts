import { TemplateRepository } from '../repository/template.repository';
import { SurveyRepository } from '../repository/survey.repository';
import { generateUniqueSlug } from '../utils/slug';

export class TemplateService {
  private repo = new TemplateRepository();
  private surveyRepo = new SurveyRepository();

  async listTemplates() {
    return this.repo.findAll();
  }

  async getTemplate(id: string) {
    const template = await this.repo.findByPublicId(id);
    if (!template) throw new Error('Template not found');
    return template;
  }

  async instantiateTemplate(userId: string, id: string) {
    const template = await this.getTemplate(id);
    const slug = await generateUniqueSlug(template.title);
    const survey = await this.surveyRepo.createSurvey({
      title: template.title,
      description: template.description,
      slug,
      theme: 'default',
      status: 'draft',
      pages: template.pages,
      createdBy: userId,
    } as any);
    return survey;
  }

  async ensureSamples(samples: any[]) {
    await this.repo.upsertMany(samples);
    const ids = samples.map(s => s.id).filter(Boolean);
    return this.repo.findManyByIds(ids);
  }
}


