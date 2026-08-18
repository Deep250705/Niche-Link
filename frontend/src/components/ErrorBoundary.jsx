import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 mt-5">
          <div className="glass-card p-5 text-center max-width-600 mx-auto">
            <h1 className="text-danger mb-4">Something went wrong</h1>
            <p className="lead text-muted mb-4">
              An unexpected error occurred. Please try refreshing the page or contact support if the issue persists.
            </p>
            <div className="alert alert-secondary text-start mb-4">
              <code>{this.state.error && this.state.error.toString()}</code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-gradient-primary"
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

export default ErrorBoundary;
