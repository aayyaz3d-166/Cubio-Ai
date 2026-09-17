/**
 * 3D Memory Studio — Funnel 73
 * Studio Runtime Error Boundary
 */

import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { RuntimeErrorManager, CapturedRuntimeError } from './runtimeErrorManager';

export interface StudioRuntimeErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: CapturedRuntimeError, reset: () => void) => React.ReactNode;
  onCatch?: (error: Error, info: any) => void;
}

export interface StudioRuntimeErrorBoundaryState {
  hasError: boolean;
  capturedError: CapturedRuntimeError | null;
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

export class StudioRuntimeErrorBoundary extends BaseComponent<
  StudioRuntimeErrorBoundaryProps,
  StudioRuntimeErrorBoundaryState
> {
  private errorManager = new RuntimeErrorManager();

  constructor(props: StudioRuntimeErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      capturedError: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<StudioRuntimeErrorBoundaryState> {
    return {
      hasError: true,
      capturedError: {
        message: error.message || 'React rendering error',
        timestamp: Date.now(),
      },
    };
  }

  public componentDidCatch(error: Error, info: any): void {
    const captured = this.errorManager.captureError(error, info);
    this.setState({ capturedError: captured });
    this.props.onCatch?.(error, info);
  }

  public reset = (): void => {
    this.errorManager.clear();
    this.setState({ hasError: false, capturedError: null });
  };

  public render(): React.ReactNode {
    if (this.state.hasError && this.state.capturedError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.capturedError, this.reset);
      }

      return (
        <div className="w-screen h-screen bg-[#070709] flex flex-col items-center justify-center p-6 font-mono text-zinc-300 select-none">
          <div className="max-w-md w-full bg-[#131316] border border-red-900/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertOctagon className="w-6 h-6" />
              <h2 className="text-sm font-bold tracking-wider uppercase">STUDIO RUNTIME ERROR</h2>
            </div>

            <p className="text-xs text-zinc-400">
              The 3D Memory Studio encountered an unexpected runtime exception.
            </p>

            <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl text-[11px] text-red-300 space-y-1">
              {this.state.capturedError.component && (
                <div className="text-[10px] text-zinc-500 font-bold">
                  COMPONENT: {this.state.capturedError.component}
                </div>
              )}
              <div>{this.state.capturedError.message}</div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={this.reset}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Runtime</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
