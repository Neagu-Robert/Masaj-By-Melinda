import React, { useState } from 'react';
import * as Sentry from '@sentry/react';

interface FormErrorBoundaryProps {
  children: React.ReactNode;
  feature?: string;
}

const FormErrorFallback: React.FC<{ resetError: () => void }> = ({ resetError }) => {
  return (
    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 my-4">
      <div className="flex items-start space-x-3">
        <svg
          className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-400 mb-2">A apărut o eroare</h3>
          <p className="text-gray-300 mb-4">
            A apărut o eroare la procesarea formularului. Vă rugăm să încercați din nou.
          </p>
          <button
            onClick={resetError}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Încearcă din nou
          </button>
        </div>
      </div>
    </div>
  );
};

export const FormErrorBoundary: React.FC<FormErrorBoundaryProps> = ({ children, feature = 'unknown' }) => {
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  return (
    <Sentry.ErrorBoundary
      key={resetKey}
      fallback={<FormErrorFallback resetError={handleReset} />}
      beforeCapture={(scope, error, componentStack) => {
        scope.setTag('layer', 'frontend');
        scope.setTag('feature', feature);
        scope.setTag('severity', 'warning');
        scope.setContext('react', { componentStack });
      }}
      onReset={handleReset}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};
