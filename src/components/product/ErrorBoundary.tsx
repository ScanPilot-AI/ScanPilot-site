import { Component, type ErrorInfo, type ReactNode } from "react";
import { ProductFallback } from "./ProductFallback";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ScanPilot ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <ProductFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
