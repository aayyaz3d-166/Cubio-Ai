/**
 * 3D Memory Studio — Funnel 65
 * Component: RuntimeErrorView
 *
 * Friendly fallback view when WebGL or components encounter errors.
 */

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface RuntimeErrorViewProps {
  message?: string;
  onRetry: () => void;
}

export const RuntimeErrorView: React.FC<RuntimeErrorViewProps> = ({
  message = '3D View or Runtime is temporarily unavailable.',
  onRetry,
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#070709] text-zinc-300 font-mono select-none">
      <div className="max-w-md w-full bg-[#111114] border border-amber-800/60 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
        <div className="flex justify-center text-amber-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Runtime Notice
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {message}
        </p>
        <div className="pt-2 flex justify-center">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    </div>
  );
};
