import React, { useState, useEffect, useMemo } from 'react';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { fetchRespondentsApi, updateSurveyRespondentsApi } from '../../api-paths/surveysApi';
import { useRespondents } from '../../contexts/RespondentContext';
// import type { Respondent, RespondentGroup } from '../../api-paths/respondentsApi';

interface RespondentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId: string;
}

const RespondentsModal: React.FC<RespondentsModalProps> = ({ isOpen, onClose, surveyId }) => {
  const { respondents, groups, fetchRespondents, fetchGroups } = useRespondents();
  
  const [selectedRespondentIds, setSelectedRespondentIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dropdown states
  const [respondentSearchQuery, setRespondentSearchQuery] = useState('');
  const [isRespondentDropdownOpen, setIsRespondentDropdownOpen] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSelectedRespondentIds([]);
      setSelectedGroupIds([]);
      setError(null);
      setSuccess(null);
      
      loadSurveyRespondents();
      fetchRespondents();
      fetchGroups();
    }
  }, [isOpen, surveyId]);

  const loadSurveyRespondents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRespondentsApi(surveyId);
      
      // Handle null/undefined data gracefully
      if (!data) {
        setSelectedRespondentIds([]);
        setSelectedGroupIds([]);
        return;
      }
      
      // data structure: { surveyId, allowedRespondents: [...ids], allowedGroups: [...ids] }
      const respondentIds = data.allowedRespondents || [];
      const groupIds = data.allowedGroups || [];
      
      
      // Handle both string IDs and objects (in case backend still returns populated data)
      const validRespondentIds = Array.isArray(respondentIds) 
        ? respondentIds.map((id: any) => {
            if (typeof id === 'string') return id;
            if (id && typeof id === 'object' && id._id) return id._id;
            return null;
          }).filter((id: any) => id && typeof id === 'string')
        : [];
        
      const validGroupIds = Array.isArray(groupIds) 
        ? groupIds.map((id: any) => {
            if (typeof id === 'string') return id;
            if (id && typeof id === 'object' && id._id) return id._id;
            return null;
          }).filter((id: any) => id && typeof id === 'string')
        : [];
      
      
      // Additional validation - ensure all IDs are valid ObjectIds
      const finalRespondentIds = validRespondentIds.filter(id => 
        id && id.length === 24 && /^[0-9a-fA-F]+$/.test(id)
      );
      const finalGroupIds = validGroupIds.filter(id => 
        id && id.length === 24 && /^[0-9a-fA-F]+$/.test(id)
      );
      
      
      setSelectedRespondentIds(finalRespondentIds);
      setSelectedGroupIds(finalGroupIds);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading respondents');
      // Set empty arrays on error to prevent further issues
      setSelectedRespondentIds([]);
      setSelectedGroupIds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      
      // Validate ObjectIds before sending
      const validRespondentIds = selectedRespondentIds.filter(id => {
        const isValid = id && typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]+$/.test(id);
        return isValid;
      });
      const validGroupIds = selectedGroupIds.filter(id => {
        const isValid = id && typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]+$/.test(id);
        return isValid;
      });

      if (validRespondentIds.length !== selectedRespondentIds.length || 
          validGroupIds.length !== selectedGroupIds.length) {
        setError('Invalid respondent or group IDs detected. Please refresh and try again.');
        return;
      }

      await updateSurveyRespondentsApi(surveyId, validRespondentIds, validGroupIds);
      
      setSuccess('Respondents and groups updated successfully. Invitations will be sent when the survey goes live.');
      
      // Refresh the data to show updated state
      await loadSurveyRespondents();
      
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error updating respondents');
    } finally {
      setSaving(false);
    }
  };

  // Filter available respondents
  const filteredRespondents = useMemo(() => {
    return respondents.filter(r => {
      const matchesSearch = respondentSearchQuery === '' || 
        r.name.toLowerCase().includes(respondentSearchQuery.toLowerCase()) ||
        r.mail.toLowerCase().includes(respondentSearchQuery.toLowerCase());
      const notSelected = !selectedRespondentIds.includes(r._id);
      return matchesSearch && notSelected && !r.isArchived;
    });
  }, [respondents, respondentSearchQuery, selectedRespondentIds]);

  // Filter available groups
  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      const matchesSearch = groupSearchQuery === '' || 
        g.name.toLowerCase().includes(groupSearchQuery.toLowerCase());
      const notSelected = !selectedGroupIds.includes(g._id);
      return matchesSearch && notSelected && !g.isArchived;
    });
  }, [groups, groupSearchQuery, selectedGroupIds]);

  // Get selected respondent objects
  const selectedRespondentsData = useMemo(() => {
    return respondents.filter(r => selectedRespondentIds.includes(r._id));
  }, [respondents, selectedRespondentIds]);

  // Get selected group objects
  const selectedGroupsData = useMemo(() => {
    return groups.filter(g => selectedGroupIds.includes(g._id));
  }, [groups, selectedGroupIds]);

  const handleAddRespondent = (respondentId: string) => {
    setSelectedRespondentIds(prev => [...prev, respondentId]);
    setRespondentSearchQuery('');
    setIsRespondentDropdownOpen(false);
  };

  const handleRemoveRespondent = (respondentId: string) => {
    setSelectedRespondentIds(prev => prev.filter(id => id !== respondentId));
  };

  const handleAddGroup = (groupId: string) => {
    setSelectedGroupIds(prev => [...prev, groupId]);
    setGroupSearchQuery('');
    setIsGroupDropdownOpen(false);
  };

  const handleRemoveGroup = (groupId: string) => {
    setSelectedGroupIds(prev => prev.filter(id => id !== groupId));
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!isOpen) return null;

      return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Manage Recipients
            </h2>
            <button
              onClick={handleClose}
              disabled={saving}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Alerts */}
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

          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : (
            <>
              {/* Info Banner */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Automated Email Invitations:</strong> Survey invitations will be automatically sent to all respondents when the survey goes live.
              </p>
            </div>

              {/* Respondents Section */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Add Respondents
                </h3>
                
                {/* Respondent Dropdown-with-Add */}
                <div className="relative mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter Respondent:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={respondentSearchQuery}
                      onChange={(e) => {
                        setRespondentSearchQuery(e.target.value);
                        setIsRespondentDropdownOpen(true);
                      }}
                      onFocus={() => setIsRespondentDropdownOpen(true)}
                      placeholder="Search respondents by name or email..."
                      className="w-full px-3 py-2 border rounded-md focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-2 focus:border-blue-500"
                    />
                    
                    {/* Dropdown */}
                    {isRespondentDropdownOpen && filteredRespondents.length > 0 && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsRespondentDropdownOpen(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredRespondents.map((respondent) => (
                            <button
                              key={respondent._id}
                              type="button"
                              onClick={() => handleAddRespondent(respondent._id)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                {respondent.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {respondent.mail}
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Selected Respondents */}
                {selectedRespondentsData.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Selected Respondents:
                    </p>
                    <div className="space-y-2">
                      {selectedRespondentsData.map((respondent) => (
                        <div
                          key={respondent._id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {respondent.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {respondent.mail}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRespondent(respondent._id)}
                            className="ml-3 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Groups Section */}
              <div className="mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Add Groups
                </h3>
                
                {/* Group Dropdown-with-Add */}
                <div className="relative mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter Group:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={groupSearchQuery}
                      onChange={(e) => {
                        setGroupSearchQuery(e.target.value);
                        setIsGroupDropdownOpen(true);
                      }}
                      onFocus={() => setIsGroupDropdownOpen(true)}
                      placeholder="Search groups by name..."
                      className="w-full px-3 py-2 border rounded-md focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-2 focus:border-blue-500"
                    />
                    
                    {/* Dropdown */}
                    {isGroupDropdownOpen && filteredGroups.length > 0 && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsGroupDropdownOpen(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredGroups.map((group) => (
                            <button
                              key={group._id}
                              type="button"
                              onClick={() => handleAddGroup(group._id)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                {group.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Selected Groups */}
                {selectedGroupsData.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Selected Groups:
                    </p>
                    <div className="space-y-2">
                      {selectedGroupsData.map((group) => (
                        <div
                          key={group._id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {group.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGroup(group._id)}
                            className="ml-3 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RespondentsModal;
