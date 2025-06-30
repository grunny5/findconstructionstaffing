"use client";

import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ApiErrorStateProps {
  /** Error object from the API call */
  error?: Error | null;
  /** Whether this is a network error (no connection) */
  isNetworkError?: boolean;
  /** Custom error message to display */
  message?: string;
  /** Callback function to retry the failed request */
  onRetry?: () => void;
  /** Optional title for the error state */
  title?: string;
  /** Optional additional content to display */
  children?: React.ReactNode;
}

export default function ApiErrorState({
  error,
  isNetworkError = false,
  message,
  onRetry,
  title,
  children,
}: ApiErrorStateProps) {
  // Determine error type and appropriate messaging
  const errorTitle = title || (isNetworkError ? 'Connection Problem' : 'Something went wrong');
  
  const errorMessage = message || (
    isNetworkError
      ? 'Unable to connect to our servers. Please check your internet connection and try again.'
      : error?.message || 'We encountered an error while loading the data. Please try again.'
  );

  return (
    <Alert className="bg-red-50 border-red-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {isNetworkError ? (
            <WifiOff className="h-5 w-5 text-red-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <AlertTitle className="text-red-900 font-semibold mb-2">
            {errorTitle}
          </AlertTitle>
          <AlertDescription className="text-red-700">
            {errorMessage}
          </AlertDescription>
          
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
          
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-4 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}