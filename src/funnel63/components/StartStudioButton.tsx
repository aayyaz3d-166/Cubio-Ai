/**
 * 3D Memory Studio — Funnel 63
 * Component: StartStudioButton
 *
 * Accessible, high-visibility START STUDIO CTA button.
 */

import React from 'react';
import { Play, Sparkles } from 'lucide-react';
import { StartButtonState } from '../entry/startButtonController';

interface StartStudioButtonProps {
  buttonState: StartButtonState;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  onFocus: (focused: boolean) => void;
}

export const StartStudioButton: React.FC<StartStudioButtonProps> = ({
  buttonState,
  onClick,
  onHover,
  onFocus,
}) => {
  const isTransitioning = buttonState === 'ACTIVE' || buttonState === 'DISABLED';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onFocus(true)}
      onBlur={() => onFocus(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      disabled={isTransitioning}
      tabIndex={0}
      aria-label="Start 3D Memory Studio"
      className={`group relative px-10 py-3.5 rounded-2xl font-mono font-extrabold text-sm tracking-wider transition-all duration-300 transform flex items-center gap-3 cursor-pointer shadow-2xl ${
        isTransitioning
          ? 'bg-zinc-800 text-zinc-500 scale-95 opacity-80 cursor-not-allowed shadow-none'
          : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-cyan-500/40 hover:scale-105 active:scale-95'
      }`}
    >
      {/* Background Subtle Glow */}
      {!isTransitioning && (
        <span className="absolute -inset-1 rounded-2xl bg-cyan-400/20 blur-md group-hover:bg-cyan-400/40 transition-all pointer-events-none" />
      )}

      <Play className={`w-4 h-4 text-black fill-black transition-transform ${isTransitioning ? '' : 'group-hover:translate-x-0.5'}`} />
      <span>{isTransitioning ? 'ENTERING STUDIO...' : 'START STUDIO'}</span>
      <Sparkles className="w-3.5 h-3.5 text-black opacity-80" />
    </button>
  );
};
