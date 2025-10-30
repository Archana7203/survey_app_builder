import { buildApiUrl } from './apiConfig';

export interface EmailValidationResult {
  valid: boolean;
  hasMX: boolean;
  domainExists: boolean;
  error?: string;
}

export const validateEmailApi = async (email: string): Promise<EmailValidationResult> => {
  const res = await fetch(buildApiUrl('/api/email-validation/validate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Email validation failed');
  }

  return res.json();
};
