import { buildApiUrl } from './apiConfig';
export const fetchMeApi = async () => {
  const res = await fetch(buildApiUrl('/api/auth/me'), { credentials: 'include' });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return res.json(); 
};
export const loginApi = async (email: string, password: string) => {
  const res = await fetch(buildApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Login failed');
  }

  return res.json(); 
};
export const registerApi = async (email: string, password: string) => {
  const res = await fetch(buildApiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, role: 'creator' }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Register failed');
  }

  return res.json(); 
};
export const logoutApi = async () => {
  const res = await fetch(buildApiUrl('/api/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`${errorText}`);
  }
};

// SSO API functions
export const ssoLoginApi = () => {
  // Redirect to SSO login endpoint
  window.location.href = buildApiUrl('/api/auth/sso/login');
};

export const ssoLogoutApi = () => {
  // Redirect to SSO logout endpoint
  window.location.href = buildApiUrl('/api/auth/sso/logout');
};

export const fetchSSOUserApi = async () => {
  const res = await fetch(buildApiUrl('/api/auth/sso/me'), { 
    credentials: 'include' 
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return res.json();
};