import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';

const AuthPage: React.FC = () => {
  const { login, register, ssoLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (error) {
      alert(error);
      setError(null);
    }
  }, [error]);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      globalThis.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSsoLogin = () => {
    if (loading) {
      return;
    }
    ssoLogin();
  };

  const handleSsoKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    handleSsoLogin();
  };

  // ✅ Extracted submit button text
  let submitButtonText: string;
  if (loading) {
    submitButtonText = 'Please wait...';
  } else if (mode === 'login') {
    submitButtonText = 'Log in';
  } else {
    submitButtonText = 'Sign up';
  }


  // ✅ Extracted mode toggle button text and handler
  const toggleButtonText =
    mode === 'login' ? 'Create an account' : 'Have an account? Log in';
  const toggleButtonHandler = () =>
    mode === 'login' ? setMode('register') : setMode('login');

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="max-w-md w-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === 'login' ? 'Log in' : 'Create your account'}
          </h1>
          <p className="text-gray-600 dark:text-white mb-6">
            {mode === 'login'
              ? 'Access your survey dashboard'
              : 'Sign up and start creating surveys in minutes!'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {submitButtonText}
            </Button>
          </form>

          {/* SSO Login Section */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                className="w-full flex items-center justify-center space-x-2"
                onClick={handleSsoLogin}
                onKeyDown={handleSsoKeyDown}
                aria-label="Sign in with Microsoft"
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#0078d4" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
                <span>Sign in with Microsoft</span>
              </Button>
            </div>
          </div>

          <div className="mt-4 text-sm text-center text-gray-600 dark:text-white">
            <button
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
              onClick={toggleButtonHandler}
            >
              {toggleButtonText}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AuthPage;
