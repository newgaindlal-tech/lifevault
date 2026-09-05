import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-xs text-rose-700">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-xs font-semibold text-rose-900 underline hover:text-rose-950"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};