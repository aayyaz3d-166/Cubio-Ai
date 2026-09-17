/**
 * 3D Memory Studio — Funnel 76
 * Component: StudioBootBoundary
 */

import React from 'react';
import { StudioBootFailure } from './StudioBootFailure';

export interface StudioBootBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  onCatch?: (error: Error, info: any) => void;
}

export interface StudioBootBoundaryState {
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

export class StudioBootBoundary extends BaseComponent<
  StudioBootBoundaryProps,
  StudioBootBoundaryState
> {
  constructor(props: StudioBootBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<StudioBootBoundaryState> {
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
        <div className="w-screen h-screen bg-[#070709] flex items-center justify-center p-6 select-none font-mono">
          <StudioBootFailure
            error={this.state.error.message}
            onRetry={this.reset}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
