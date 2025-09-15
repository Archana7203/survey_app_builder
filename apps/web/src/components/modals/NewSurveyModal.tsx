import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';

interface NewSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    closeDate: string;
  }) => void;
  loading?: boolean;
}

const NewSurveyModal: React.FC<NewSurveyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    closeDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.closeDate && new Date(formData.closeDate) <= new Date()) {
      newErrors.closeDate = 'Close date must be in the future';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    setFormData({ title: '', description: '', closeDate: '' });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Survey"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Survey Title"
          placeholder="Enter survey title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={errors.title}
          required
        />

        <TextArea
          label="Description (Optional)"
          placeholder="Describe your survey purpose and goals"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
        />

        <Input
          label="Close Date (Optional)"
          type="datetime-local"
          value={formData.closeDate}
          onChange={(e) => handleChange('closeDate', e.target.value)}
          error={errors.closeDate}
          helperText="When should this survey stop accepting responses?"
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Survey'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewSurveyModal;





