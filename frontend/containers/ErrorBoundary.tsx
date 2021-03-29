import React from 'react';

export class ErrorBoundary extends React.Component<{}, { error?: Error }> {
  state: { error?: Error } = {};

  componentDidCatch(error: Error, errorInfo: any) {
    console.warn('componentDidCatch', error, errorInfo);
  }

  static getDerivedStateFromError(error: Error) {
    console.warn('getDerivedStateFromError', error);
    return {
      error: error,
    };
  }

  render() {
    console.warn('render', this.state);
    if (this.state.error) {
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="p-4 text-center">
          <span className="font-medium">Something went wrong!</span>
          <br />
          <span className="text-sm">{this.state.error.message}</span>
        </div>
      </div>;
    }

    return this.props.children;
  }
}
