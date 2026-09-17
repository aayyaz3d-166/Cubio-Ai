/**
 * 3D Memory Studio — Funnel 73
 * Component: BootDiagnostics
 */

import React from 'react';
import { BootDiagnosticsData } from '../types';
import { Check, X } from 'lucide-react';

interface BootDiagnosticsProps {
  diagnostics: BootDiagnosticsData;
}

export const BootDiagnostics: React.FC<BootDiagnosticsProps> = ({ diagnostics }) => {
  const items = [
    { label: 'ROOT CONTAINER', ok: diagnostics.rootMounted },
    { label: 'F55 RENDERER HOST', ok: diagnostics.rendererAvailable },
    { label: 'F56 SCENE GRAPH', ok: diagnostics.sceneAvailable },
    { label: 'F61 CAMERA ENGINE', ok: diagnostics.cameraAvailable },
    { label: 'F65 STUDIO SHELL', ok: diagnostics.studioAvailable },
    { label: 'F72 RUNTIME ACTIVATION', ok: diagnostics.f72Ready },
    { label: 'F67 DATABASE UI', ok: diagnostics.databaseAvailable },
    { label: 'F71 PERSISTENCE LAYER', ok: diagnostics.persistenceAvailable },
  ];

  return (
    <div className="w-full space-y-2 font-mono text-xs text-left">
      <div className="text-[10px] text-zinc-400 font-bold tracking-wider">SUBSYSTEM AVAILABILITY:</div>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-1.5 bg-zinc-900/60 rounded border border-zinc-800 text-[10px]"
          >
            <span className="text-zinc-400">{item.label}</span>
            {item.ok ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Check className="w-3 h-3" /> OK
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-400 font-bold">
                <X className="w-3 h-3" /> FAIL
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
