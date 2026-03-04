"use client";

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'loading';
  progress?: number;
  onClose?: () => void;
}

export function Toast({ message, type = 'info', progress, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (type !== 'loading' && !progress) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, progress, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div
        className={cn(
          "min-w-[300px] max-w-md rounded-lg border shadow-lg p-4",
          type === 'success' && "bg-green-50 border-green-200",
          type === 'error' && "bg-red-50 border-red-200",
          type === 'loading' && "bg-blue-50 border-blue-200",
          type === 'info' && "bg-white border-gray-200"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {type === 'loading' && (
              <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {type === 'success' && (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {type === 'error' && (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {type === 'info' && (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium",
              type === 'success' && "text-green-900",
              type === 'error' && "text-red-900",
              type === 'loading' && "text-blue-900",
              type === 'info' && "text-gray-900"
            )}>
              {message}
            </p>

            {/* Progress bar */}
            {progress !== undefined && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>{progress}% complete</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      type === 'loading' && "bg-blue-600",
                      type === 'success' && "bg-green-600"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Close button */}
          {type !== 'loading' && (
            <button
              onClick={() => {
                setIsVisible(false);
                onClose?.();
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
