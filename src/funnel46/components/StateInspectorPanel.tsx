/**
 * 3D Memory Studio — Funnel 46
 * Component: StateInspectorPanel
 *
 * Panel 3: Detailed read-only state inspector showing identity, source,
 * integrity, 369 sequence, coordinate, and provenance lineage.
 */

import React from 'react';
import { StateInspectorViewModel } from '../../funnel45/types';
import { ShieldCheck, Fingerprint, MapPin, Binary, Compass, Link2 } from 'lucide-react';

interface StateInspectorPanelProps {
  inspector?: StateInspectorViewModel;
}

export const StateInspectorPanel: React.FC<StateInspectorPanelProps> = ({ inspector }) => {
  if (!inspector) {
    return (
      <div className="p-8 text-center text-zinc-500 font-mono text-xs">
        No state selected. Select a state from the Data Explorer or Search Console to inspect details.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 font-mono text-xs">
      {/* Identity Card */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-[#27272a] pb-1.5 text-zinc-300 font-semibold">
          <div className="flex items-center gap-1.5">
            <Fingerprint className="w-4 h-4 text-cyan-400" />
            <span>State Identity & Scope</span>
          </div>
          <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">
            Dimension Z{inspector.dimension}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-zinc-400 text-[11px]">
          <div>
            <span className="text-zinc-500">State ID: </span>
            <span className="text-white font-medium break-all">{inspector.stateId}</span>
          </div>
          <div>
            <span className="text-zinc-500">Record ID: </span>
            <span className="text-cyan-300 font-medium">{inspector.recordId}</span>
          </div>
          <div>
            <span className="text-zinc-500">Document ID: </span>
            <span className="text-zinc-300">{inspector.documentId}</span>
          </div>
          <div>
            <span className="text-zinc-500">Universe ID: </span>
            <span className="text-zinc-300">{inspector.universeId}</span>
          </div>
        </div>
      </div>

      {/* Encoding & Coordinates Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-zinc-300 font-semibold border-b border-[#27272a] pb-1.5">
            <Binary className="w-4 h-4 text-emerald-400" />
            <span>369 Representation</span>
          </div>
          <div className="space-y-1 text-[11px] text-zinc-400">
            <div>
              <span className="text-zinc-500">Ternary Sequence:</span>
              <div className="p-1.5 bg-[#111113] rounded border border-[#27272a] text-emerald-400 font-mono text-[10px] break-all mt-0.5 max-h-16 overflow-y-auto">
                {inspector.sequence369}
              </div>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-zinc-500">Base-3 BigInt State:</span>
              <span className="text-white font-mono">{inspector.numericStateBigIntString.substring(0, 16)}...</span>
            </div>
          </div>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-zinc-300 font-semibold border-b border-[#27272a] pb-1.5">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Spatial Coordinates</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-zinc-400">
            <div className="flex justify-between">
              <span className="text-zinc-500">Formatted Coordinate:</span>
              <span className="text-amber-300 font-bold">{inspector.formattedCoordinate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Coordinate ID:</span>
              <span className="text-zinc-300 font-mono text-[10px] truncate max-w-[180px]" title={inspector.coordinateId}>
                {inspector.coordinateId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Category:</span>
              <span className="text-white bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">{inspector.category}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Source & Integrity Card */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-[#27272a] pb-1.5 text-zinc-300 font-semibold">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Source Provenance & Integrity</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border ${
              inspector.integrityValid
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-rose-950 text-rose-400 border-rose-800'
            }`}
          >
            {inspector.integrityValid ? 'INTEGRITY VERIFIED' : 'INTEGRITY CORRUPTED'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-zinc-400 text-[11px]">
          <div>
            <span className="text-zinc-500">Source Domain: </span>
            <span className="text-white">{inspector.sourceDomain}</span>
          </div>
          <div>
            <span className="text-zinc-500">Payload Checksum: </span>
            <span className="text-emerald-400 font-mono">{inspector.payloadChecksum}</span>
          </div>
          <div className="col-span-2">
            <span className="text-zinc-500">Source URL: </span>
            <span className="text-cyan-400 break-all">{inspector.sourceUrl}</span>
          </div>
        </div>
      </div>

      {/* Raw Payload Preview (Bounded) */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 space-y-1.5">
        <div className="flex items-center justify-between text-zinc-400 text-[11px]">
          <span className="font-semibold text-zinc-300">Canonical JSON Payload (Read-Only)</span>
          <span className="text-[10px] text-zinc-500">Size: {new TextEncoder().encode(inspector.canonicalJson).length}B</span>
        </div>
        <pre className="p-2 bg-[#111113] border border-[#27272a] rounded text-[10px] text-zinc-300 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
          {inspector.canonicalJson}
        </pre>
      </div>
    </div>
  );
};
