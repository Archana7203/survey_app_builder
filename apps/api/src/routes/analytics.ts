import express from 'express';
import { Response as SurveyResponse } from '../models/Response';
import { Survey } from '../models/Survey';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/analytics/:surveyId - Get analytics for a survey (creator only)
router.get('/:surveyId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;

    // Check if survey exists and user is the creator
    const survey = await Survey.findOne({ _id: surveyId, createdBy: req.user._id });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or you do not have permission to view this survey' });
    }

    // Get all responses for this survey
    const responses = await SurveyResponse.find({ survey: survey._id });

    if (responses.length === 0) {
      return res.json({ 
        surveyId,
        totalResponses: 0,
        questions: []
      });
    }

    // Process analytics for each question
    const questionAnalytics = [];

    for (const page of survey.pages) {
      for (const question of page.questions) {
        const questionResponses = responses
          .map(r => r.responses.find(resp => resp.questionId === question.id))
          .filter((resp): resp is NonNullable<typeof resp> => resp !== undefined);

        if (questionResponses.length === 0) {
          questionAnalytics.push({
            questionId: question.id,
            type: question.type,
            title: question.title,
            totalResponses: 0,
            analytics: null
          });
          continue;
        }

        let analytics: any = {};

        switch (question.type) {
          case 'singleChoice':
          case 'multiChoice':
          case 'dropdown':
            // Choice-based questions - counts
            const counts: Record<string, number> = {};
            questionResponses.forEach(resp => {
              if (Array.isArray(resp.value)) {
                resp.value.forEach(val => {
                  counts[val] = (counts[val] || 0) + 1;
                });
              } else if (resp.value) {
                counts[resp.value] = (counts[resp.value] || 0) + 1;
              }
            });
            analytics = { type: 'choice', counts };
            break;

          case 'slider':
          case 'ratingStar':
          case 'ratingNumber':
          case 'ratingSmiley':
            // Rating/slider questions - avg, min, max, distribution
            const values = questionResponses
              .map(resp => Number(resp.value))
              .filter(val => !isNaN(val));
            
            if (values.length > 0) {
              const sum = values.reduce((a, b) => a + b, 0);
              const avg = sum / values.length;
              const min = Math.min(...values);
              const max = Math.max(...values);
              
              // Create distribution buckets
              const buckets: Record<string, number> = {};
              values.forEach(val => {
                buckets[val.toString()] = (buckets[val.toString()] || 0) + 1;
              });

              analytics = {
                type: 'numeric',
                avg: Math.round(avg * 100) / 100,
                min,
                max,
                distribution: buckets
              };
            }
            break;

          case 'textShort':
          case 'textLong':
            // Text questions - top 30 words (stop-word filtered)
            const stopWords = new Set([
              'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
              'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
              'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'cannot', 'could', 'should',
              'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
              'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
            ]);

            const allText = questionResponses
              .map(resp => resp.value?.toString() || '')
              .join(' ')
              .toLowerCase()
              .replace(/[^\w\s]/g, '')
              .split(/\s+/)
              .filter(word => word.length > 1 && !stopWords.has(word));

            const wordCounts: Record<string, number> = {};
            allText.forEach(word => {
              wordCounts[word] = (wordCounts[word] || 0) + 1;
            });

            const topWords = Object.entries(wordCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 30)
              .map(([word, count]) => ({ word, count }));

            analytics = { type: 'text', topWords };
            break;



          default:
            // For other question types, just count responses
            analytics = { 
              type: 'basic', 
              responseCount: questionResponses.length 
            };
        }

        questionAnalytics.push({
          questionId: question.id,
          type: question.type,
          title: question.title,
          totalResponses: questionResponses.length,
          analytics
        });
      }
    }

    res.json({
      surveyId,
      totalResponses: responses.length,
      questions: questionAnalytics
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
