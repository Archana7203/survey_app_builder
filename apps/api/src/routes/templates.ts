import express from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import type { ITemplate } from '../models/Template';
import { TemplateService } from '../services/template.service';
import log from '../logger';  // ✅ Import logger

const router = express.Router();
const service = new TemplateService();

// GET /api/templates - List all available templates
router.get('/', async (req, res) => {
  try {
    log.info('Fetching templates list', 'GET_TEMPLATES');
    
    const templates = await service.listTemplates();
    
    log.info('Templates fetched successfully', 'GET_TEMPLATES', { 
      count: templates.length 
    });
    
    res.json(templates);
  } catch (error) {
    log.error('Failed to fetch templates', 'GET_TEMPLATES', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/templates/:id - Get single template details
router.get('/:id', async (req, res) => {
  try {
    const templateId = req.params.id;
    
    log.info('Fetching template details', 'GET_TEMPLATE', { templateId });
    
    const template = await service.getTemplate(templateId);

    res.json(template);
  } catch (error) {
    log.error('Failed to fetch template', 'GET_TEMPLATE', { 
      templateId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/templates/:id/instantiate - Create survey from template
router.post('/:id/instantiate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const templateId = req.params.id;
    const userId = req.user._id.toString();
    
    log.info('Instantiating template', 'INSTANTIATE_TEMPLATE', { 
      templateId,
      userId 
    });
    
    const newSurvey = await service.instantiateTemplate(userId, templateId);
    
    log.info('Template instantiated successfully', 'INSTANTIATE_TEMPLATE', { 
      templateId,
      surveyId: String(newSurvey._id),
      surveyTitle: newSurvey.title,
      userId 
    });
    
    res.status(201).json({
      id: newSurvey._id,
      title: newSurvey.title,
      description: newSurvey.description,
      slug: newSurvey.slug,
      theme: newSurvey.theme,
      status: newSurvey.status,
      closeDate: newSurvey.closeDate,
      pages: newSurvey.pages,
      createdAt: newSurvey.createdAt,
      updatedAt: newSurvey.updatedAt,
      templateId: req.params.id,
    });
  } catch (error) {
    log.error('Failed to instantiate template', 'INSTANTIATE_TEMPLATE', { 
      templateId: req.params.id,
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Server error' });
  }
});

// Utility to ensure sample templates exist (idempotent)
const ensureSampleTemplates = async () => {
  const samples: Partial<ITemplate>[] = [
    {
      id: 'covid-19-vaccination',
      title: 'COVID-19 Vaccination Survey',
      description: 'Understand vaccination status and perceptions',
      category: 'Healthcare',
      thumbnail: '💉',
      estimatedTime: '3-4 minutes',
      pages: [
        { questions: [ { id: 'vaccinated', type: 'singleChoice', title: 'Have you received a COVID-19 vaccine?', required: true, options: [ { id: 'yes', text: 'Yes' }, { id: 'no', text: 'No' } ] } ] },
        { questions: [ { id: 'doses', type: 'dropdown', title: 'If yes, how many doses?', required: false, options: [ { id: 'one', text: 'One dose' }, { id: 'two', text: 'Two doses' }, { id: 'booster', text: 'Booster received' } ] } ] },
        { questions: [ { id: 'side_effects', type: 'textLong', title: 'Did you experience any side effects?', required: false, settings: { placeholder: 'Describe briefly...' } } ] },
      ],
    },
    {
      id: 'impact-of-social-media',
      title: 'Impact of Social Media',
      description: 'Explore usage and perceived impact of social media',
      category: 'Research',
      thumbnail: '📱',
      estimatedTime: '3-4 minutes',
      pages: [
        { questions: [ { id: 'daily_time', type: 'slider', title: 'How many hours per day do you spend on social media?', required: true, settings: { scaleMin: 0, scaleMax: 12, scaleStep: 1 } } ] },
        { questions: [ { id: 'platforms', type: 'multiChoice', title: 'Which platforms do you use regularly?', required: false, options: [ { id: 'facebook', text: 'Facebook' }, { id: 'instagram', text: 'Instagram' }, { id: 'x', text: 'X/Twitter' }, { id: 'tiktok', text: 'TikTok' }, { id: 'youtube', text: 'YouTube' } ], settings: { allowOther: true } } ] },
        { questions: [ { id: 'impact', type: 'singleChoice', title: 'Overall, what is the impact of social media on your life?', required: true, options: [ { id: 'positive', text: 'Positive' }, { id: 'neutral', text: 'Neutral' }, { id: 'negative', text: 'Negative' } ] } ] },
      ],
    },
  ];

  const { TemplateRepository } = await import('../repository/template.repository');
  const repo = new TemplateRepository();
  await repo.upsertMany(samples);
};

// POST /api/templates/ensure-samples - Upsert sample templates (creator-only)
router.post('/ensure-samples', requireAuth, async (req: AuthRequest, res) => {
  try {
    log.info('Ensuring sample templates', 'ENSURE_SAMPLES', { 
      userId: req.user._id.toString() 
    });
    
    await ensureSampleTemplates();
    
    const { TemplateRepository } = await import('../repository/template.repository');
    const repo = new TemplateRepository();
    const updated = await repo.findManyByIds(['covid-19-vaccination', 'impact-of-social-media']);
    
    log.info('Sample templates ensured successfully', 'ENSURE_SAMPLES', { 
      updatedCount: updated.length,
      userId: req.user._id.toString()
    });
    
    res.json({ updated });
  } catch (error) {
    log.error('Failed to ensure sample templates', 'ENSURE_SAMPLES', { 
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to ensure sample templates' });
  }
});

export default router;
