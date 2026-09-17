/**
 * 3D Memory Studio — Funnel 65
 * Runtime Error Boundary & Diagnostic Recovery
 */

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export interface RuntimeErrorBoundaryProps {
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}

export interface RuntimeErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
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

export class RuntimeErrorBoundary extends BaseComponent<
  RuntimeErrorBoundaryProps,
  RuntimeErrorBoundaryState
> {
  constructor(props: RuntimeErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  public static getDerivedStateFromError(error: Error): RuntimeErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unknown runtime exception',
    };
  }

  public componentDidCatch(error: Error, errorInfo: any): void {
    console.error('[F65 RuntimeErrorBoundary] Caught exception:', error, errorInfo);
  }

  public handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <div className="w-screen h-screen bg-[#070709] flex flex-col items-center justify-center p-6 font-mono text-zinc-300 select-none">
          <div className="max-w-md w-full bg-[#111114] border border-red-800/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-base font-extrabold tracking-wider uppercase">
                Studio Runtime Exception
              </h2>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              The 3D Memory Studio encountered an unexpected runtime state. Safe recovery is available.
            </p>

            <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl text-[11px] text-red-300 break-words">
              {this.state.errorMessage}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={this.handleRetry}
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
