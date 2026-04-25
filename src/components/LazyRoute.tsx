import React, { Suspense } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';

interface LazyRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyRoute = React.memo(function LazyRoute({ 
  children, 
  fallback 
}: LazyRouteProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" text="Đang tải trang..." />
    </div>
  );

  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
});