import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ChartSelector, { type ChartType } from '../../components/charts/ChartSelector';
import ChartRenderer from '../../components/charts/ChartRenderer';
import { exportReport } from '../../utils/exportReport';
import { fetchSurveyByIdApi } from '../../api-paths/surveysApi';
import { fetchAnalyticsApi } from '../../api-paths/analyticsApi';

interface ResultsQuestionAnalytics {
  questionId: string;
  type: string;
  title: string;
  totalResponses: number;
  analytics: {
    type: 'choice' | 'numeric' | 'text' | 'matrix' | 'grid' | 'basic';
    data?: Record<string, unknown>;
    values?: Array<{ label: string; value: number; percentage: number }>;
    stats?: {
      min?: number;
      max?: number;
      average?: number;
      responses?: number;
    };
    textResponses?: string[];
  } | null;
}

interface AnalyticsData {
  surveyId: string;
  totalResponses: number;
  questions: ResultsQuestionAnalytics[];
}

interface Survey {
  id: string;
  title: string;
  description?: string;
  createdAt?: string;
}

const Results: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [socket, setSocket] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSurvey = useCallback(async () => {
    if (!surveyId) return;

    try {
      const data = await fetchSurveyByIdApi(surveyId);
      setSurvey(data);
      setError(null);
    } catch (error: any) {
      console.error('Survey fetch error:', error);
      setError(error.message || 'Error loading survey data');
    }
  }, [surveyId]);

  const fetchAnalytics = useCallback(async () => {
    if (!surveyId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchAnalyticsApi(surveyId); // call API service
      setAnalyticsData(data);
      setLastUpdated(new Date());

      const defaultCharts: Record<string, ChartType> = {};
      for (const q of data.questions as ResultsQuestionAnalytics[]) {
        switch (q.analytics?.type) {
          case 'choice':
          case 'matrix':
          case 'grid':
            defaultCharts[q.questionId] = 'Bar';
            break;
          case 'numeric':
            defaultCharts[q.questionId] = 'Line';
            break;
          case 'text':
            defaultCharts[q.questionId] = 'WordCloud';
            break;
          default:
            defaultCharts[q.questionId] = 'Bar';
        }
      }
      setChartTypes(defaultCharts);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error loading analytics data'); // optional: replace setError with alert
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  const setupSocket = useCallback(() => {
    if (!surveyId) return;
    
    const newSocket = io(import.meta.env.VITE_API_BASE_URL!, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-survey', surveyId);
    });

    newSocket.on('response:new', () => {
      // Re-fetch analytics when new response comes in
      fetchAnalytics();
    });

    newSocket.on('disconnect', () => {
      // Handle disconnect
    });

    setSocket(newSocket);
  }, [surveyId]);

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
      fetchAnalytics();
      setupSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [surveyId]);

  const getAvailableChartTypes = (analyticsType: string): ChartType[] => {
    switch (analyticsType) {
      case 'choice':
      case 'numeric':
        return ['Bar', 'Pie', 'Line'];
      case 'text':
        return ['WordCloud'];
      case 'matrix':
      case 'grid':
        return ['Bar', 'Pie', 'Line'];
      default:
        return ['Bar'];
    }
  };

  const updateChartType = (questionId: string, chartType: ChartType) => {
    setChartTypes(prev => ({
      ...prev,
      [questionId]: chartType,
    }));
  };

  const handleExportPDF = () => {
    if (survey && analyticsData) {
      exportReport(survey, analyticsData);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Survey Results</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {analyticsData.totalResponses} responses collected
            {lastUpdated && (
              <span className="ml-2 text-sm">
                (Last updated: {lastUpdated.toLocaleTimeString()})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF} disabled={!survey || !analyticsData}>
            Download PDF
          </Button>
          <Button variant="outline" onClick={fetchAnalytics}>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Response Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData.totalResponses}
              </div>
              <div className="text-sm text-gray-500">Total Responses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.questions.length}
              </div>
              <div className="text-sm text-gray-500">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analyticsData.questions.filter(q => q.totalResponses > 0).length}
              </div>
              <div className="text-sm text-gray-500">Questions with Responses</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Question Analytics */}
      {analyticsData.questions.map((question) => (
        <Card key={question.questionId}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {question.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {question.totalResponses} responses • {question.type}
                </p>
              </div>
              {question.analytics && (
                <div className="w-48">
                  <ChartSelector
                    value={chartTypes[question.questionId] || 'Bar'}
                    onChange={(type) => updateChartType(question.questionId, type)}
                    availableTypes={getAvailableChartTypes(question.analytics.type)}
                  />
                </div>
              )}
            </div>

            {(() => {
              if (question.totalResponses === 0) {
                return (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No responses yet for this question
                  </div>
                );
              } else if (question.analytics) {
                return (
                  <ChartRenderer
                    chartType={chartTypes[question.questionId] || 'Bar'}
                    data={question.analytics}
                    title=''
                  />
                );
              } else {
                return (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Analytics not available for this question type
                  </div>
                );
              }
            })()}
          </div>
        </Card>
      ))}

      {analyticsData.questions.length === 0 && (
        <Card>
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No questions found in this survey
          </div>
        </Card>
      )}
    </div>
  );
};

export default Results;
