import { Component, ReactNode } from 'react';
import { trackError } from '../utils/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send error to centralized analytics
    trackError({
      error,
      errorInfo,
      fatal: false
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="container section-py">
          <div className="alert alert--error">
            <h3>Something went wrong</h3>
            <p>We're sorry, but something unexpected happened. Please refresh the page and try again.</p>
            <button 
              className="btn btn--primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}