import express from 'express';
import { Template } from '../models/Template';
import { Survey } from '../models/Survey';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateUniqueSlug } from '../utils/slug';
import type { ITemplate } from '../models/Template';

const router = express.Router();

// GET /api/templates - List all available templates
router.get('/', async (req, res) => {
  try {
    const templates = await Template.find({})
      .select('id title description category thumbnail estimatedTime pages')
      .sort({ category: 1, title: 1 });

    res.json(templates);
  } catch (error) {
    console.error('Template fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/templates/:id - Get single template details
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findOne({ id: req.params.id });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Template fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/templates/:id/instantiate - Create survey from template
router.post('/:id/instantiate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const template = await Template.findOne({ id: req.params.id });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Generate unique slug and title for the new survey
    const slug = await generateUniqueSlug(template.title);

    // Create new survey from template
    const newSurvey = new Survey({
      title: template.title,
      description: template.description,
      slug,
      theme: 'default',
      status: 'draft',
      pages: template.pages, // Use template's pages structure
      createdBy: req.user._id,
    });

    await newSurvey.save();

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
      templateId: template.id,
    });
  } catch (error) {
    console.error('Template instantiation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

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

  for (const tpl of samples) {
    await Template.updateOne({ id: tpl.id }, { $setOnInsert: tpl }, { upsert: true });
  }
};

// POST /api/templates/ensure-samples - Upsert sample templates (creator-only)
router.post('/ensure-samples', requireAuth, async (_req: AuthRequest, res) => {
  try {
    await ensureSampleTemplates();
    const updated = await Template.find({ id: { $in: ['covid-19-vaccination', 'impact-of-social-media'] } })
      .select('id title category');
    res.json({ updated });
  } catch (error) {
    console.error('Ensure samples error:', error);
    res.status(500).json({ error: 'Failed to ensure sample templates' });
  }
});

