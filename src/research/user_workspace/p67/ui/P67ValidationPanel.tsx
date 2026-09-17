/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Validation & Export Panel
 */

import React from 'react';
import { ParametricFeatureGraph, FeatureValidationReport, AdvancedGeometryScene } from '../types';
import { FeatureExportEngine } from '../featureExport';
import { ShieldCheck, Download, Activity, AlertTriangle } from 'lucide-react';

interface P67ValidationPanelProps {
  graph: ParametricFeatureGraph;
  scene: AdvancedGeometryScene;
  report: FeatureValidationReport;
  onExport: (type: 'OBJ' | 'STL' | 'META') => void;
}

export const P67ValidationPanel: React.FC<P67ValidationPanelProps> = ({
  graph,
  scene,
  report,
  onExport,
}) => {
  return (
    <div className="flex border-t border-zinc-800 h-[120px] bg-black/70 font-mono text-[9px] p-3 gap-4">
      {/* ── VALIDATION STATUS ── */}
      <div className="w-[300px] border-r border-zinc-800 pr-3 space-y-1">
        <div className="flex items-center gap-1 font-bold text-amber-400">
          <ShieldCheck className="w-3.5 h-3.5" /> FEATURE VALIDATION
        </div>
        <div>
          Status: <strong className={report.isValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{report.status}</strong>
        </div>
        <div>Report Checksum: <span className="text-zinc-400">{report.reportChecksum}</span></div>
        <div className="text-[8px] text-zinc-500">
          {report.isValid ? '✓ DAG is acyclic and parameters are valid.' : report.issues.join(', ')}
        </div>
      </div>

      {/* ── EXPORT CONTROLS ── */}
      <div className="w-[260px] border-r border-zinc-800 pr-3 space-y-1.5">
        <div className="font-bold text-cyan-400 flex items-center gap-1">
          <Download className="w-3.5 h-3.5" /> RESEARCH EXPORT GATING
        </div>
        <div className="text-[8px] text-zinc-400">
          Classification: <strong className={report.isValid ? 'text-emerald-400' : 'text-red-400'}>
            {report.isValid ? 'RESEARCH_EXPORT_READY' : 'RESEARCH_EXPORT_BLOCKED'}
          </strong>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onExport('OBJ')}
            disabled={!report.isValid}
            className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 disabled:opacity-30 text-cyan-300 rounded border border-cyan-500/30 text-[8.5px] cursor-pointer"
          >
            Export OBJ
          </button>
          <button
            onClick={() => onExport('STL')}
            disabled={!report.isValid}
            className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 disabled:opacity-30 text-cyan-300 rounded border border-cyan-500/30 text-[8.5px] cursor-pointer"
          >
            Export STL
          </button>
          <button
            onClick={() => onExport('META')}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 text-[8.5px] cursor-pointer"
          >
            Export META
          </button>
        </div>
      </div>

      {/* ── SCIENTIFIC PRINCIPLE ── */}
      <div className="flex-1 space-y-1">
        <div className="font-bold text-zinc-400 flex items-center gap-1">
          <Activity className="w-3 h-3 text-purple-400" /> SCIENTIFIC BOUNDARY
        </div>
        <div className="text-zinc-500 text-[8.5px]">
          Parametric construction can deterministically generate new geometry from explicitly defined parameters and constraints, but it cannot recover information that was never observed or encoded.
        </div>
      </div>
    </div>
  );
};
