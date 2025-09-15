import { Template } from '../models/Template';
import * as fs from 'fs';
import * as path from 'path';

const loadTemplatesData = () => {
  const templatesPath = path.join(__dirname, '../data/templates.json');
  const templatesJson = fs.readFileSync(templatesPath, 'utf8');
  return JSON.parse(templatesJson);
};

export const seedTemplates = async () => {
  try {
    console.log('Seeding templates...');
    
    // Load templates from JSON file, plus ensure custom samples
    const templatesData = loadTemplatesData();

    // Custom predefined slides: COVID-19 Vaccination and Impact of Social Media
    const customTemplates = [
      {
        id: 'covid-19-vaccination',
        title: 'COVID-19 Vaccination Survey',
        description: 'Understand vaccination status and perceptions',
        category: 'Healthcare',
        thumbnail: '💉',
        estimatedTime: '3-4 minutes',
        pages: [
          {
            questions: [
              { id: 'vaccinated', type: 'singleChoice', title: 'Have you received a COVID-19 vaccine?', required: true, options: [ { id: 'yes', text: 'Yes' }, { id: 'no', text: 'No' } ] },
            ],
          },
          {
            questions: [
              { id: 'doses', type: 'dropdown', title: 'If yes, how many doses?', required: false, options: [ { id: 'one', text: 'One dose' }, { id: 'two', text: 'Two doses' }, { id: 'booster', text: 'Booster received' } ] },
            ],
          },
          {
            questions: [
              { id: 'side_effects', type: 'textLong', title: 'Did you experience any side effects?', required: false, settings: { placeholder: 'Describe briefly...' } },
            ],
          },
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
          {
            questions: [
              { id: 'daily_time', type: 'slider', title: 'How many hours per day do you spend on social media?', required: true, settings: { scaleMin: 0, scaleMax: 12, scaleStep: 1 } },
            ],
          },
          {
            questions: [
              { id: 'platforms', type: 'multiChoice', title: 'Which platforms do you use regularly?', required: false, options: [ { id: 'facebook', text: 'Facebook' }, { id: 'instagram', text: 'Instagram' }, { id: 'x', text: 'X/Twitter' }, { id: 'tiktok', text: 'TikTok' }, { id: 'youtube', text: 'YouTube' } ], settings: { allowOther: true } },
            ],
          },
          {
            questions: [
              { id: 'impact', type: 'singleChoice', title: 'Overall, what is the impact of social media on your life?', required: true, options: [ { id: 'positive', text: 'Positive' }, { id: 'neutral', text: 'Neutral' }, { id: 'negative', text: 'Negative' } ] },
            ],
          },
        ],
      },
    ];
    // If empty, insert all
    const existingCount = await Template.countDocuments();
    if (existingCount === 0) {
      await Template.insertMany([...templatesData, ...customTemplates]);
      console.log(`Successfully seeded ${templatesData.length + customTemplates.length} templates`);
      return;
    }

    // Otherwise, upsert custom ones to guarantee presence
    for (const tpl of customTemplates) {
      await Template.updateOne(
        { id: tpl.id },
        { $setOnInsert: tpl },
        { upsert: true }
      );
    }
    console.log('Ensured Healthcare and Research templates are present');
  } catch (error) {
    console.error('Error seeding templates:', error);
    throw error;
  }
};

export const reseedTemplates = async () => {
  try {
    console.log('Re-seeding templates...');
    
    // Clear existing templates
    await Template.deleteMany({});
    
    // Load and insert templates from JSON file
    const templatesData = loadTemplatesData();
    await Template.insertMany(templatesData);
    
    console.log(`Successfully re-seeded ${templatesData.length} templates`);
  } catch (error) {
    console.error('Error re-seeding templates:', error);
    throw error;
  }
};
