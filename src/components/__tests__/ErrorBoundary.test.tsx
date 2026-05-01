import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const BuggyComponent = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Silence console.error for expected errors in tests
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Safe Child</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders fallback UI when an error occurs', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="fallback">Error Fallback</div>}>
        <BuggyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('renders default error UI when no fallback is provided', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! Có lỗi xảy ra')).toBeInTheDocument();
  });

  it('allows retrying after an error', () => {
    const { unmount } = render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Thử lại')).toBeInTheDocument();
    
    // Simulate retry click
    fireEvent.click(screen.getByText('Thử lại'));
    // It will catch the error again since BuggyComponent still throws
    expect(screen.getByText('Oops! Có lỗi xảy ra')).toBeInTheDocument();
    
    unmount();
  });
});
