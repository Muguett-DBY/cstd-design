import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="empty-state" style={{ minHeight: 200, margin: 24 }}>
          <img src="/brand/mascot.png" alt="" />
          <strong>出了点问题</strong>
          <span>{this.state.error.message}</span>
          <button type="button" className="primary-button" style={{ marginTop: 12 }} onClick={() => this.setState({ error: null })}>
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
