// React is imported by default in React 18+
import { useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function ThankYou() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 relative">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full mx-4">
        <Card>
          <div className="p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-6">
              <svg 
                className="h-8 w-8 text-green-600 dark:text-green-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>

            {/* Message */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Thank You!
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your responses have been submitted successfully. We appreciate your time and feedback.
            </p>

            {/* Survey identifier */}
            {slug && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Survey: {slug}
              </p>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {/* Desktop close button */}
              <button
                onClick={() => window.close()}
                className="hidden md:block w-full px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Close Window
              </button>
              
              {/* Mobile close text */}
              <div className="md:hidden text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  You may now exit the survey and close the window
                </p>
              </div>
            </div>

            {/* Additional message */}
            <div className="mt-8 p-4 bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/20 rounded-lg">
              <p className="text-sm text-[var(--color-primary)] dark:text-[var(--color-primary)]">
                💡 Your responses help us improve our services. If you have any questions, 
                please don't hesitate to contact us.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
