/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Top Bar UI Component
 *
 * Displays Funnel Branding, Reality Anchor [5, 3, 6], Sync Status, and Core Invariants.
 */

import React from 'react';
import {
  Globe,
  ShieldCheck,
  Activity,
  RefreshCw,
  LogOut,
  Sliders,
} from 'lucide-react';
import { WorldModelSyncStatus } from '../types';

export interface R11TopBarProps {
  readonly syncStatus: WorldModelSyncStatus;
  readonly onResync: () => void;
  readonly onExit?: () => void;
}

export const R11TopBar: React.FC<R11TopBarProps> = ({
  syncStatus,
  onResync,
  onExit,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '46px',
        padding: '0 16px',
        backgroundColor: '#090D16',
        borderBottom: '1px solid #1E293B',
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      {/* Left: Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(37, 99, 235, 0.5)',
          }}
        >
          <Globe className="w-3.5 h-3.5 text-white" />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', color: '#F8FAFC' }}>
          3D MEMORY STUDIO
        </span>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: '#1E3A8A',
            color: '#93C5FD',
            fontWeight: 700,
          }}
        >
          FUNNEL F11: SPATIAL WORLD MODEL
        </span>
      </div>

      {/* Center: Invariants & Canonical Reality Anchor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '5px',
            backgroundColor: '#06281E',
            border: '1px solid #059669',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span style={{ color: '#6EE7B7', fontWeight: 600 }}>REALITY ANCHOR:</span>
          <span style={{ color: '#34D399', fontWeight: 800 }}>[5, 3, 6]</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '5px',
            backgroundColor: '#1E1B4B',
            border: '1px solid #6366F1',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#C7D2FE',
            fontWeight: 700,
          }}
        >
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>ΔREALITY = 0</span>
        </div>

        <span
          style={{
            padding: '3px 8px',
            borderRadius: '5px',
            backgroundColor: '#312E81',
            border: '1px solid #4338CA',
            color: '#A5B4FC',
            fontWeight: 800,
            fontSize: '10px',
            fontFamily: 'monospace',
          }}
        >
          σ² = 0
        </span>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onResync}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            backgroundColor: syncStatus === 'SYNCED' ? '#1E293B' : '#B45309',
            color: syncStatus === 'SYNCED' ? '#CBD5E1' : '#FEF3C7',
            border: '1px solid ' + (syncStatus === 'SYNCED' ? '#334155' : '#F59E0B'),
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
          title="Synchronize World Model with upstream state"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{syncStatus}</span>
        </button>

        {onExit && (
          <button
            onClick={onExit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: '#1E1B4B',
              color: '#CBD5E1',
              border: '1px solid #4338CA',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Exit F11</span>
          </button>
        )}
      </div>
    </header>
  );
};
