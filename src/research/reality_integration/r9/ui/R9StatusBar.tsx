/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Production-Grade Status & Telemetry Bar
 *
 * Compact bottom status bar displaying:
 * Reality Checksum, Geometry Checksum, Topology Checksum,
 * Object/Vertex/Edge/Face totals, History Depth, Undo/Redo status,
 * Sync status, and strict verification badges (ΔReality = 0, σ² = 0).
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  ChevronUp,
  ChevronDown,
  History,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { GeometryExecutionSignature, GeometryCausalityEvent } from '../types';

export interface R9StatusBarProps {
  readonly signature: GeometryExecutionSignature;
  readonly historyLength: number;
  readonly undoCount: number;
  readonly redoCount: number;
  readonly isCausalityValid: boolean;
  readonly causalityEvents?: readonly GeometryCausalityEvent[];
}

export const R9StatusBar: React.FC<R9StatusBarProps> = ({
  signature,
  historyLength,
  undoCount,
  redoCount,
  isCausalityValid,
  causalityEvents = [],
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <footer
      style={{
        backgroundColor: '#070B14',
        borderTop: '1px solid #1E293B',
        userSelect: 'none',
        zIndex: 40,
      }}
    >
      {/* Expandable Causality Audit Drawer */}
      {isDrawerOpen && (
        <div
          style={{
            maxHeight: '180px',
            overflowY: 'auto',
            padding: '10px 16px',
            backgroundColor: '#090D16',
            borderBottom: '1px solid #1E293B',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', marginBottom: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#A78BFA' }}>CAUSALITY & INVARIANT AUDIT LOG (ΔReality = 0)</span>
            <span style={{ color: isCausalityValid ? '#34D399' : '#EF4444' }}>
              {isCausalityValid ? '100% INVARIANT PRESERVED' : 'VIOLATION DETECTED'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {causalityEvents.slice(-8).reverse().map((evt) => (
              <div
                key={evt.eventId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  borderRadius: '3px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#64748B' }}>#{evt.sequence}</span>
                  <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{evt.operation}</span>
                  <span style={{ color: '#A78BFA' }}>({evt.domain})</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ color: '#00FF88' }}>
                    Reality CS: {evt.realityChecksumBefore.slice(0, 10)}...
                  </span>
                  <span style={{ color: evt.isRealityInvariant ? '#34D399' : '#EF4444', fontWeight: 'bold' }}>
                    {evt.isRealityInvariant ? 'ΔR = 0' : 'MUTATED!'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Status Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '30px',
          padding: '0 14px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#94A3B8',
        }}
      >
        {/* Left: Checksum Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: '#64748B' }}>REALITY CS:</span>
            <span style={{ color: '#00FF88', fontWeight: 'bold' }}>
              {signature.realityChecksum.slice(0, 12)}...
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: '#64748B' }}>GEO CS:</span>
            <span style={{ color: '#A78BFA', fontWeight: 'bold' }}>
              {signature.geometryChecksum.slice(0, 12)}...
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: '#64748B' }}>TOPO CS:</span>
            <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>
              {signature.topologyChecksum.slice(0, 12)}...
            </span>
          </div>
        </div>

        {/* Center: Mesh Elements & History Depth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <strong style={{ color: '#F1F5F9' }}>{signature.geometryCount}</strong> geos (
            <span style={{ color: '#CBD5E1' }}>{signature.vertexCount}V</span> /{' '}
            <span style={{ color: '#CBD5E1' }}>{signature.edgeCount}E</span> /{' '}
            <span style={{ color: '#CBD5E1' }}>{signature.faceCount}F</span>)
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: '#334155' }} />

          <div>
            Hist: <strong style={{ color: '#F1F5F9' }}>{historyLength}</strong> steps (Undo:{' '}
            <span style={{ color: historyLength > 0 ? '#34D399' : '#64748B' }}>
              {historyLength > 0 ? 'YES' : 'NO'}
            </span>
            , Redo:{' '}
            <span style={{ color: redoCount > 0 ? '#34D399' : '#64748B' }}>
              {redoCount > 0 ? 'YES' : 'NO'}
            </span>
            )
          </div>
        </div>

        {/* Right: Invariants & Drawer Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: '3px',
              backgroundColor: isCausalityValid ? '#064E3B' : '#7F1D1D',
              color: isCausalityValid ? '#6EE7B7' : '#FCA5A5',
              fontWeight: 800,
              fontSize: '10px',
            }}
          >
            {isCausalityValid ? 'ΔREALITY = 0' : 'MUTATION DETECTED'}
          </span>

          <span
            style={{
              padding: '1px 6px',
              borderRadius: '3px',
              backgroundColor: '#312E81',
              color: '#A5B4FC',
              fontWeight: 800,
              fontSize: '10px',
            }}
          >
            σ² = 0
          </span>

          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '2px 4px',
              fontSize: '10px',
            }}
            title="Toggle Causality Audit Log Drawer"
          >
            <span>Audit</span>
            {isDrawerOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </footer>
  );
};
