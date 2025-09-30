import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../../utils/apiConfig';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

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
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRespondents();
    }
  }, [isOpen, surveyId]);

  const fetchRespondents = async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/surveys/${surveyId}/respondents`), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRespondents(data.allowedRespondents);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load respondents');
      }
    } catch {
      setError('Error loading respondents');
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
      const response = await fetch(buildApiUrl(`/api/surveys/${surveyId}/respondents`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: newEmail.trim() }),
      });

      if (response.ok) {
        setRespondents(prev => [...prev, newEmail.trim()]);
        setNewEmail('');
        setSuccess('Respondent added successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add respondent');
      }
    } catch {
      setError('Error adding respondent');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteRespondent = async (email: string) => {
    setDeleting(email);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(buildApiUrl(`/api/surveys/${surveyId}/respondents/${encodeURIComponent(email)}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setRespondents(prev => prev.filter(e => e !== email));
        setSuccess('Respondent removed successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove respondent');
      }
    } catch {
      setError('Error removing respondent');
    } finally {
      setDeleting(null);
    }
  };

  const handleSendInvitations = async () => {
    setSendingInvitations(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(buildApiUrl(`/api/surveys/${surveyId}/respondents/send-invitations`), {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setShowConfirmSend(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send invitations');
      }
    } catch {
      setError('Error sending invitations');
    } finally {
      setSendingInvitations(false);
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

          {respondents.length > 0 && (
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmSend(true)}
                className="w-full"
              >
                Send Invitations to All Respondents ({respondents.length})
              </Button>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Allowed Respondents
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Add or remove respondents. Emails will only be sent when you click "Send Invitations".
            </p>
            {renderRespondentsContent()}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmSend}
        onClose={() => setShowConfirmSend(false)}
        title="Confirm Sending Invitations"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to send survey invitations to all {respondents.length} respondents? 
            This action cannot be undone.
          </p>

          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Recipients:</p>
            <div className="max-h-32 overflow-y-auto">
              {respondents.map((email) => (
                <div key={email} className="text-sm text-gray-700 dark:text-gray-300 py-1">
                  {email}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmSend(false)}
              disabled={sendingInvitations}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSendInvitations}
              disabled={sendingInvitations}
            >
              {sendingInvitations ? 'Sending...' : 'Send Invitations'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RespondentsModal;
