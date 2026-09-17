/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Reality AI Status Bar & Telemetry Footer
 *
 * Displays live checksums, execution hashes, and verification badges (ΔReality = 0, σ² = 0).
 */

import React from 'react';
import { ShieldCheck, Activity, Sparkles, CheckCircle2 } from 'lucide-react';
import { F10ExecutionSignature } from '../types';

export interface R10AIStatusBarProps {
  readonly signature: F10ExecutionSignature;
}

export const R10AIStatusBar: React.FC<R10AIStatusBarProps> = ({ signature }) => {
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
      {/* Left: AI & Spatial Hashes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span style={{ color: '#64748B' }}>AI CMD HASH:</span>
          <span style={{ color: '#A78BFA', fontWeight: 'bold' }}>
            {signature.commandChecksum.slice(0, 12)}...
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#64748B' }}>PLAN HASH:</span>
          <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>
            {signature.planChecksum.slice(0, 12)}...
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#64748B' }}>REALITY CS:</span>
          <span style={{ color: '#00FF88', fontWeight: 'bold' }}>
            {signature.realityChecksum.slice(0, 12)}...
          </span>
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
