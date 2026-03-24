import React, { ReactNode, ReactElement } from 'react';
import { AlertCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactElement;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-background flex items-center justify-center px-6">
            <div className="max-w-md w-full space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">Something went wrong</h1>
                <p className="text-foreground/60">
                  {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                <Button
                  variant="outline"
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-xs text-blue-400 overflow-auto max-h-48">
                  <pre className="whitespace-pre-wrap break-words">
                    {this.state.error?.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
