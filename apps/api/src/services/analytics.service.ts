import { Survey } from '../models/Survey';
import { Response as SurveyResponse } from '../models/Response';

export class AnalyticsService {
  async getSurveyAnalytics(surveyId: string, userId: string) {
    // Check if survey exists and belongs to user
    const survey = await Survey.findOne({ _id: surveyId, createdBy: userId });
    if (!survey) return null;

    // Get responses
    const responses = await SurveyResponse.find({ survey: survey._id });
    if (responses.length === 0) {
      return { surveyId, totalResponses: 0, questions: [] };
    }

    const questionAnalytics: any[] = [];

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
          case 'dropdown':{
            const counts: Record<string, number> = {};
            questionResponses.forEach(resp => {
              if (Array.isArray(resp.value)) {
                resp.value.forEach(val => { counts[val] = (counts[val] || 0) + 1; });
              } else if (resp.value) {
                counts[resp.value] = (counts[resp.value] || 0) + 1;
              }
            });
            analytics = { type: 'choice', counts };
            break;
          }
          case 'slider':
          case 'ratingStar':
          case 'ratingNumber':
          case 'ratingSmiley':{
            const values = questionResponses.map(r => Number(r.value)).filter(v => !Number.isNaN(v));
            if (values.length > 0) {
              const sum = values.reduce((a, b) => a + b, 0);
              const avg = sum / values.length;
              const min = Math.min(...values);
              const max = Math.max(...values);
              const distribution: Record<string, number> = {};
              values.forEach(v => { distribution[v.toString()] = (distribution[v.toString()] || 0) + 1; });
              analytics = { type: 'numeric', avg: Math.round(avg * 100)/100, min, max, distribution };
            }
            break;
          }
          case 'textShort':
          case 'textLong': {
            const stopWords = new Set([
              'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
              'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
              'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'cannot',
              'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
              'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
            ]);
            const allText = questionResponses
              .map(r => r.value?.toString() || '')
              .join(' ')
              .toLowerCase()
              .replace(/[^\w\s]/g, '')
              .split(/\s+/)
              .filter(word => word.length > 1 && !stopWords.has(word));
            const wordCounts: Record<string, number> = {};
            allText.forEach(word => { wordCounts[word] = (wordCounts[word] || 0) + 1; });
            const topWords = Object.entries(wordCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 30)
              .map(([word, count]) => ({ word, count }));
            analytics = { type: 'text', topWords };
            break;
          }
          default:
            analytics = { type: 'basic', responseCount: questionResponses.length };
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

    return { surveyId, totalResponses: responses.length, questions: questionAnalytics };
  }
}
