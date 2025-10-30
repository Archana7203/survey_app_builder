import { Survey } from '../models/Survey';
import { Response as SurveyResponse } from '../models/Response';

export class AnalyticsService {
  async getSurveyAnalytics(surveyId: string, userId: string) {
    const survey = await Survey.findOne({ _id: surveyId, createdBy: userId });
    if (!survey) return null;

    const responses = await SurveyResponse.find({ survey: survey._id });

    if (responses.length === 0) {
      return { surveyId, totalResponses: 0, questions: [] };
    }

    const questionAnalytics = this.buildQuestionAnalytics(survey, responses);

    return { surveyId, totalResponses: responses.length, questions: questionAnalytics };
  }

  private buildQuestionAnalytics(survey: any, responses: any[]): any[] {
    const analytics: any[] = [];

    for (const page of survey.pages) {
      for (const question of page.questions) {
        const questionResponses = this.getQuestionResponses(responses, question.id);
        const analyticsData = this.analyzeQuestion(question, questionResponses);
        analytics.push(analyticsData);
      }
    }

    return analytics;
  }

  private getQuestionResponses(responses: any[], questionId: string): any[] {
    return responses
      .map(r => r.responses.find((resp: any) => resp.questionId === questionId))
      .filter((resp): resp is NonNullable<typeof resp> => resp !== undefined);
  }

  private analyzeQuestion(question: any, questionResponses: any[]): any {
    if (questionResponses.length === 0) {
      return {
        questionId: question.id,
        type: question.type,
        title: question.title,
        totalResponses: 0,
        analytics: null
      };
    }

    const analytics = this.calculateAnalytics(question, questionResponses);

    return {
      questionId: question.id,
      type: question.type,
      title: question.title,
      totalResponses: questionResponses.length,
      analytics
    };
  }

  private calculateAnalytics(question: any, questionResponses: any[]): any {
    const choiceTypes = ['singleChoice', 'multiChoice', 'dropdown'];
    const numericTypes = ['slider', 'ratingStar', 'ratingNumber'];
    const textTypes = ['textShort', 'textLong'];

    // Handle smiley rating specially
    if (question.type === 'ratingSmiley') {
      return this.analyzeSmileyRating(questionResponses);
    }

    if (choiceTypes.includes(question.type)) {
      return this.analyzeChoiceQuestion(question, questionResponses);
    }

    if (numericTypes.includes(question.type)) {
      return this.analyzeNumericQuestion(questionResponses);
    }

    if (textTypes.includes(question.type)) {
      return this.analyzeTextQuestion(questionResponses);
    }

    return { type: 'basic', responseCount: questionResponses.length };
  }

  // Smiley rating label mapping
  private getSmileyLabel(value: string): string {
    const smileyMap: Record<string, string> = {
      'very_sad': 'Very Sad',
      'sad': 'Sad',
      'neutral': 'Neutral',
      'happy': 'Happy',
      'very_happy': 'Very Happy'
    };
    return smileyMap[value] || value;
  }

  private analyzeSmileyRating(questionResponses: any[]): any {
    const counts: Record<string, number> = {};

    for (const resp of questionResponses) {
      if (resp.value) {
        // Smiley ratings store string values like "very_sad", "sad", etc.
        const value = typeof resp.value === 'string' ? resp.value : resp.value.toString();
        counts[value] = (counts[value] || 0) + 1;
      }
    }

    // Convert to distribution with labels
    const distribution: Record<string, number> = {};
    Object.entries(counts).forEach(([key, value]) => {
      distribution[this.getSmileyLabel(key)] = value;
    });

    return {
      type: 'numeric',
      distribution
    };
  }

  private analyzeChoiceQuestion(question: any, questionResponses: any[]): any {
    const counts: Record<string, number> = {};

    // Get option labels from question
    const optionMap: Record<string, string> = {};
    if (question.options && Array.isArray(question.options)) {
      question.options.forEach((opt: any) => {
        // Support both {id, text} and string formats
        if (typeof opt === 'object' && opt.id && opt.text) {
          optionMap[opt.id] = opt.text;
        } else if (typeof opt === 'string') {
          optionMap[opt] = opt;
        }
      });
    }

    for (const resp of questionResponses) {
      if (Array.isArray(resp.value)) {
        for (const val of resp.value) {
          const label = optionMap[val] || val;
          counts[label] = (counts[label] || 0) + 1;
        }
      } else if (resp.value) {
        const label = optionMap[resp.value] || resp.value;
        counts[label] = (counts[label] || 0) + 1;
      }
    }

    return { type: 'choice', counts };
  }

  private analyzeNumericQuestion(questionResponses: any[]): any {
    const values = questionResponses
      .map(r => Number(r.value))
      .filter(v => !Number.isNaN(v));

    if (values.length === 0) {
      return {};
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const distribution = this.buildDistribution(values);

    return {
      type: 'numeric',
      avg: Math.round(avg * 100) / 100,
      min,
      max,
      distribution
    };
  }

  private buildDistribution(values: number[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const v of values) {
      const key = v.toString();
      distribution[key] = (distribution[key] || 0) + 1;
    }

    return distribution;
  }

  private analyzeTextQuestion(questionResponses: any[]): any {
    const words = this.extractWords(questionResponses);
    const wordCounts = this.countWords(words);
    const topWords = this.getTopWords(wordCounts, 30);

    return { type: 'text', topWords };
  }

  private extractWords(questionResponses: any[]): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'cannot',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]);

    return questionResponses
      .map(r => r.value?.toString() || '')
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word));
  }

  private countWords(words: string[]): Record<string, number> {
    const wordCounts: Record<string, number> = {};

    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }

    return wordCounts;
  }

  private getTopWords(wordCounts: Record<string, number>, limit: number): Array<{ word: string; count: number }> {
    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  }
}
