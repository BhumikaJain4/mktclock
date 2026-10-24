import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
}) => {
  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-ink-900/80 border border-red-500/30 text-center space-y-4 my-8">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="font-display font-bold text-base text-white">
          {title}
        </h3>
        <p className="text-xs text-ink-300">
          {message}
        </p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={onRetry}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};
