import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface EmailPromptModalProps {
  isOpen: boolean;
  onSubmit: (email: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const EmailPromptModal: React.FC<EmailPromptModalProps> = ({
  isOpen,
  onSubmit,
  loading = false,
  error = null,
}) => {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Invalid email format');
      return;
    }

    try {
      await onSubmit(email.trim());
      setEmail('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to submit email');
    }
  };

  const displayError = error || localError;

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="Enter Your Email">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            disabled={loading}
            required
            className="w-full"
          />
          {displayError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{displayError}</p>
          )}
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !email.trim()}
          >
            {loading ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmailPromptModal;

