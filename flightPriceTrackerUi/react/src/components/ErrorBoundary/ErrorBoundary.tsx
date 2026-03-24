import React, { Component, useCallback, useState } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <div className="c3-card max-w-md border border-danger">
            <h2 className="mb-2 text-lg font-semibold text-destructive">Something went wrong</h2>
            <p className="text-sm text-secondary">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 py-2 px-6 text-base bg-accent text-inverse hover:bg-accent-hover transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function useErrorBoundary() {
  const [, setError] = useState<Error | null>(null);

  const reportError = useCallback((err: unknown) => {
    const error = err instanceof Error ? err : new Error(String(err));
    setError(() => {
      throw error;
    });
  }, []);

  return { reportError };
}
