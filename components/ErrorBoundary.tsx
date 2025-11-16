import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // Fix: Initialized state in the constructor for broader compatibility and to resolve potential issues with class property syntax.
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
            <span className="material-symbols-outlined text-red-500 text-6xl">error</span>
            <h1 className="text-2xl font-bold mt-4">Something went wrong.</h1>
            <p className="text-text-subtle-light dark:text-text-subtle-dark mt-2">
                We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="mt-6 bg-primary text-white font-bold py-2 px-4 rounded-full hover:bg-opacity-80 transition-colors"
            >
                Refresh Page
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
