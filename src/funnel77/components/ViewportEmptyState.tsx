/**
 * 3D Memory Studio — Funnel 77
 * Component: ViewportEmptyState
 */

import React from 'react';
import { Box } from 'lucide-react';

export const ViewportEmptyState: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-zinc-500 pointer-events-none select-none">
      <Box className="w-10 h-10 text-zinc-700 mb-2 stroke-[1.5]" />
      <div className="text-xs font-bold text-zinc-400 tracking-wider">3D SPACE</div>
      <div className="text-[11px] text-zinc-600 mt-0.5">No permitted spatial objects available.</div>
    </div>
  );
};
