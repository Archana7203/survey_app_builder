import { Response, IResponse } from '../models/Response';

export class ResponseRepository {
  async findBySurvey(surveyId: string) {
    return Response.find({ survey: surveyId }).select('respondentEmail status startedAt metadata responses');
  }

  async countBySurvey(surveyId: string) {
    return Response.countDocuments({ survey: surveyId });
  }

  async findRecentBySurveys(surveyIds: string[], limit = 50) {
    return Response.find({ survey: { $in: surveyIds } })
      .populate('survey', 'title status')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async upsertAutoSave(surveyId: string, email: string, payload: {
    responses: IResponse['responses'];
    metadata: IResponse['metadata'];
    status: 'InProgress';
    updatedAt: Date;
  }) {
    return Response.findOneAndUpdate(
      { survey: surveyId, respondentEmail: email },
      {
        $set: {
          responses: payload.responses,
          'metadata.lastPageIndex': payload.metadata.lastPageIndex,
          'metadata.timeSpent': payload.metadata.timeSpent,
          'metadata.pagesVisited': payload.metadata.pagesVisited,
          status: payload.status,
          updatedAt: payload.updatedAt,
        },
        $setOnInsert: { startedAt: new Date() },
      },
      { new: true, upsert: true }
    );
  }

  async submitFinal(surveyId: string, email: string, payload: {
    responses: IResponse['responses'];
    metadata: IResponse['metadata'];
  }) {
    return Response.findOneAndUpdate(
      { survey: surveyId, respondentEmail: email },
      {
        $set: {
          responses: payload.responses,
          'metadata.lastPageIndex': payload.metadata.lastPageIndex,
          'metadata.timeSpent': payload.metadata.timeSpent,
          'metadata.pagesVisited': payload.metadata.pagesVisited,
          status: 'Completed',
          submittedAt: new Date(),
        },
        $setOnInsert: { startedAt: new Date() },
      },
      { new: true, upsert: true }
    );
  }
}


