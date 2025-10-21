import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Input from '../ui/Input';
import { fetchRespondentsApi, addRespondentApi, removeRespondentApi } from '../../api-paths/surveysApi';

interface RespondentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId: string;
}

const RespondentsModal: React.FC<RespondentsModalProps> = ({ isOpen, onClose, surveyId }) => {
  const [respondents, setRespondents] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRespondents();
    }
  }, [isOpen, surveyId]);

  const fetchRespondents = async () => {
    try {
      const data = await fetchRespondentsApi(surveyId);
      setRespondents(data.allowedRespondents);
    } catch (error: any) {
      console.error('Fetch respondents error:', error);
      alert('Error loading respondents');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRespondent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      await addRespondentApi(surveyId, newEmail.trim());
      setRespondents(prev => [...prev, newEmail.trim()]);
      setNewEmail('');
      setSuccess('Respondent added successfully');
    } catch (error: any) {
      console.error('Add respondent error:', error);
      setError(error.message || 'Error adding respondent');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteRespondent = async (email: string) => {
    setDeleting(email);
    setError(null);
    setSuccess(null);

    try {
      await removeRespondentApi(surveyId, email);
      setRespondents(prev => prev.filter(e => e !== email));
      setSuccess('Respondent removed successfully');
    } catch (error: any) {
      console.error('Remove respondent error:', error);
      setError(error.message || 'Error removing respondent');
    } finally {
      setDeleting(null);
    }
  };

  if (!isOpen) return null;

  // Extracted render logic for clarity
  const renderRespondentsContent = () => {
    if (loading) {
      return (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      );
    }

    if (!respondents || respondents.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No respondents added yet
        </div>
      );
    }

    return (
      <div className="max-h-60 overflow-y-auto">
        <ul className="space-y-2">
          {respondents.map((email) => (
            <li
              key={email}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">{email}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteRespondent(email)}
                disabled={deleting === email}
                className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {deleting === email ? 'Removing...' : 'Remove'}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Manage Respondents
            </h2>
            <button
              onClick={() => { try { onClose(); } catch (err) { console.error(err); } }}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {error && (
            <Alert variant="error" onClose={() => setError(null)} className="mb-4">
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" onClose={() => setSuccess(null)} className="mb-4">
              {success}
            </Alert>
          )}

          <form onSubmit={handleAddRespondent} className="mb-6">
            <div className="flex gap-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1"
                required
              />
              <Button type="submit" variant="primary" disabled={adding}>
                {adding ? 'Adding...' : 'Add Respondent'}
              </Button>
            </div>
          </form>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Allowed Respondents
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Automated Email Invitations:</strong> Survey invitations will be automatically sent to all respondents when the survey goes live.
              </p>
            </div>

            {renderRespondentsContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RespondentsModal;
