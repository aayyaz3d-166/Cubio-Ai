/**
 * 3D Memory Studio — Funnel 75
 * Component: RendererHostBoundary
 */

import React from 'react';
import { RendererRecoveryBoundary } from './RendererRecoveryBoundary';

export interface RendererHostBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  onCatch?: (error: Error, info: any) => void;
}

export interface RendererHostBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ComponentInterface<P, S> {
  props: P;
  state: S;
  setState(state: Partial<S>): void;
  render(): React.ReactNode;
  componentDidCatch?(error: Error, errorInfo: any): void;
}

const BaseComponent: new <P, S>(props: P) => ComponentInterface<P, S> =
  (React.Component as any) ||
  class<P, S> {
    props: P;
    state: S;
    constructor(props: P) {
      this.props = props;
      this.state = {} as S;
    }
    setState(state: Partial<S>) {
      Object.assign(this.state as any, state);
    }
    render(): React.ReactNode {
      return null;
    }
  };

export class RendererHostBoundary extends BaseComponent<
  RendererHostBoundaryProps,
  RendererHostBoundaryState
> {
  constructor(props: RendererHostBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<RendererHostBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, info: any): void {
    this.props.onCatch?.(error, info);
  }

  public reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div className="w-full h-full flex items-center justify-center p-6 select-none font-mono">
          <RendererRecoveryBoundary
            error={this.state.error.message}
            onRetry={this.reset}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
