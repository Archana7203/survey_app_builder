import React, { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

const DashboardLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const navigation = [
    { name: 'Overview', href: '/dashboard/overview', icon: '📊' },
    { name: 'Surveys', href: '/dashboard/surveys', icon: '📝' },
    { name: 'Templates', href: '/dashboard/templates', icon: '📋' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark-mode-enabled">
      {/* Horizontal Top Navigation Bar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mr-8">
                Survey Builder
              </h1>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/20 text-[var(--color-primary)] dark:text-[var(--color-primary)]'
                      : 'text-gray-700 dark:text-gray-300 hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-500'
                  }`}
                >
                  <span className="mr-2 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side: User controls */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <ThemeToggle />
              
              {/* User menu */}
              <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <span className="hidden sm:inline">{user?.email || 'User'}</span>
                <button 
                  onClick={async () => { try { await logout(); } catch (err) { console.error(err); } }} 
                  className="px-3 py-1 rounded transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 text-blue-600 dark:text-blue-400"
                >
                  Logout
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
              <nav className="py-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/20 text-[var(--color-primary)] dark:text-[var(--color-primary)]'
                        : 'text-gray-700 dark:text-gray-300 hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-500'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;

