import React, { useEffect, useState } from 'react';
import { buildApiUrl } from '../../utils/apiConfig';
import Card from '../../components/ui/Card';

interface Response {
  _id: string;
  survey: {
    _id: string;
    title: string;
    status: string;
  };
  respondentEmail: string;
  status: string;
  createdAt: string;
  submittedAt?: string;
}

interface Stats {
  total: number;
  active: number;
  responses: number;
  templates: number;
  completedResponses: number;
}

const Overview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ 
    total: 0, 
    active: 0, 
    responses: 0, 
    templates: 0, 
    completedResponses: 0 
  });
  const [recentActivity, setRecentActivity] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [surveysRes, templatesRes, responsesRes] = await Promise.all([
          fetch(buildApiUrl('/api/surveys'), { credentials: 'include' }),
          fetch(buildApiUrl('/api/templates'), { credentials: 'include' }),
          fetch(buildApiUrl('/api/responses'), { credentials: 'include' }),
        ]);
        
        let total = 0; 
        let active = 0; 
        let templates = 0;
        let responses = 0;
        let completedResponses = 0;
        
        if (surveysRes.ok) {
          const surveysData = await surveysRes.json();
          const list = Array.isArray(surveysData) ? surveysData : (surveysData.surveys || []);
          const pageTotal = Array.isArray(list) ? list.length : 0;
          const pagination = Array.isArray(surveysData) ? null : (surveysData.pagination || null);
          total = pagination?.total ?? pageTotal;
          active = Array.isArray(list) ? list.filter((s: any) => s.status === 'published').length || 0 : 0;
        }
        
        if (templatesRes.ok) {
          const tpls = await templatesRes.json();
          templates = tpls.length || 0;
        }
        
        if (responsesRes.ok) {
          const responseData = await responsesRes.json();
          responses = responseData.totalResponses || 0;
          completedResponses = responseData.completedResponses || 0;
          setRecentActivity(responseData.recentResponses || []);
        }
        
        setStats({ total, active, responses, templates, completedResponses });
      } catch (error) {
        console.error('Failed to load overview data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'InProgress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-300 dark:text-gray-600">--</div>
                <div className="text-sm text-gray-400 dark:text-gray-500">Loading...</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
        <p className="text-gray-600 dark:text-white">Welcome to your survey dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
            <div className="text-sm text-gray-500 dark:text-white">Total Surveys</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</div>
            <div className="text-sm text-gray-500 dark:text-white">Published Surveys</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.responses}</div>
            <div className="text-sm text-gray-500 dark:text-white">Total Respondents</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.templates}</div>
            <div className="text-sm text-gray-500 dark:text-white">Templates</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Response Completion Rate" className="mt-8">
          <div className="text-center py-6">
            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.responses > 0 ? Math.round((stats.completedResponses / stats.responses) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-500 dark:text-white mt-2">
              {stats.completedResponses} of {stats.responses} responses completed
            </div>
          </div>
        </Card>

        <Card title="Survey Status Distribution" className="mt-8">
          <div className="space-y-3 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-white">Published</span>
              <span className="font-medium text-green-600 dark:text-green-400">{stats.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-white">Draft</span>
              <span className="font-medium text-gray-600 dark:text-white">{stats.total - stats.active}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Recent Activity" className="mt-8">
        {recentActivity.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto px-6 pb-6">
            {recentActivity.map((activity) => (
              <div key={activity._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${activity.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.survey?.title || 'Unknown Survey'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.respondentEmail} • {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg font-medium">No responses yet</p>
            <p className="text-sm">Start publishing surveys to see activity here</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Overview;


