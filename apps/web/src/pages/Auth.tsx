import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';

const AuthPage: React.FC = () => {
  const { login, register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
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

          {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

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
