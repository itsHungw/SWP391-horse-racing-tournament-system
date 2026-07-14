import { Component, type ErrorInfo, type ReactNode } from "react";

import { UnexpectedErrorPage } from "../../pages/errors/UnexpectedErrorPage";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_error: unknown): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught application error", error, info);
  }

  private readonly reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <UnexpectedErrorPage onRetry={this.reset} />;
    }

    return this.props.children;
  }
}
