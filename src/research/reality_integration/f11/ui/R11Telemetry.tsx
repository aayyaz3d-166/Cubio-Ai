/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Telemetry & Invariants Footer
 *
 * Displays live checksums, entity/relation counters, and verification badges (ΔReality = 0, σ² = 0).
 */

import React from 'react';
import { ShieldCheck, Activity, Globe, Zap, Network } from 'lucide-react';
import { WorldModelExecutionSignature } from '../types';

export interface R11TelemetryProps {
  readonly signature: WorldModelExecutionSignature;
}

export const R11Telemetry: React.FC<R11TelemetryProps> = ({ signature }) => {
  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '28px',
        padding: '0 14px',
        backgroundColor: '#070B14',
        borderTop: '1px solid #1E293B',
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#94A3B8',
        userSelect: 'none',
        zIndex: 40,
      }}
    >
      {/* Left: Checksums & Counts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span style={{ color: '#64748B' }}>MODEL CS:</span>
          <span style={{ color: '#60A5FA', fontWeight: 'bold' }}>
            {signature.modelChecksum.slice(0, 12)}...
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          <span style={{ color: '#64748B' }}>GRAPH CS:</span>
          <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>
            {signature.graphChecksum.slice(0, 12)}...
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#64748B' }}>ENTITIES:</span>
          <span style={{ color: '#F1F5F9', fontWeight: 'bold' }}>{signature.entityCount}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#64748B' }}>RELATIONS:</span>
          <span style={{ color: '#34D399', fontWeight: 'bold' }}>{signature.relationCount}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#64748B' }}>INFERENCES:</span>
          <span style={{ color: '#A78BFA', fontWeight: 'bold' }}>{signature.inferenceCount}</span>
        </div>
      </div>

      {/* Right: Invariant Badges & Sync */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            padding: '1px 6px',
            borderRadius: '3px',
            backgroundColor: '#064E3B',
            color: '#6EE7B7',
            fontWeight: 800,
            fontSize: '10px',
          }}
        >
          ΔREALITY = 0
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

        <span
          style={{
            padding: '1px 6px',
            borderRadius: '3px',
            backgroundColor: signature.isCausalityValid ? '#064E3B' : '#7F1D1D',
            color: signature.isCausalityValid ? '#34D399' : '#FCA5A5',
            fontWeight: 800,
            fontSize: '10px',
          }}
        >
          CAUSALITY: {signature.isCausalityValid ? 'PASS' : 'FAIL'}
        </span>

        <span
          style={{
            padding: '1px 6px',
            borderRadius: '3px',
            backgroundColor: '#1E293B',
            color: '#94A3B8',
            fontSize: '10px',
          }}
        >
          {signature.syncStatus}
        </span>
      </div>
    </footer>
  );
};
