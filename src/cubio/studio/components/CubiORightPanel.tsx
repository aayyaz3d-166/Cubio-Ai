/**
 * CubiO — Universal Spatial Operating Environment
 * Exact Reference Right-Column Dashboard Deck (System Overview, Core Status, Quick Actions & Intelligence)
 */

import React, { useState } from 'react';
import {
  Cpu,
  Brain,
  Layers,
  Database,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Terminal,
  Settings,
  PlusCircle,
  Play,
  CheckCircle2,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import {
  CubiOIntelligenceQuery,
  CubiOState,
  CubiOHarmonic369,
  CubiODimension,
} from '../../types';

export interface CubiORightPanelProps {
  readonly activeTab: 'INTELLIGENCE' | 'REASONING' | 'PREDICTION' | 'INSPECTOR' | string;
  readonly onSelectTab: (tab: any) => void;
  readonly queries: readonly CubiOIntelligenceQuery[];
  readonly onExecuteQuery: (promptText: string) => void;
  readonly activeState: (CubiOState | any) | null;
  readonly harmonic: CubiOHarmonic369;
  readonly activeDimension: CubiODimension;
  readonly selectedCubeFace: number | null;
  readonly onQuickAction?: (actionId: string) => void;
  readonly onOpenLogs?: () => void;
  readonly onOpenSettings?: () => void;
}

export const CubiORightPanel: React.FC<CubiORightPanelProps> = ({
  activeTab,
  onSelectTab,
  queries,
  onExecuteQuery,
  activeState,
  harmonic,
  activeDimension,
  selectedCubeFace,
  onQuickAction,
  onOpenLogs,
  onOpenSettings,
}) => {
  // Sparkline Waveform SVG generator
  const renderSparkline = (color = '#38BDF8') => (
    <svg width="60" height="16" viewBox="0 0 60 16" fill="none" style={{ shrink: 0 }}>
      <path
        d="M2 8 L8 12 L14 4 L20 14 L26 2 L32 10 L38 6 L44 12 L50 4 L56 8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const systemMetrics = [
    { label: 'Processing Engine', value: '78%', icon: Cpu },
    { label: 'Memory Usage', value: '62%', icon: Database },
    { label: 'Learning Rate', value: '0.037', icon: TrendingUp },
    { label: 'Prediction Accuracy', value: '92.4%', icon: Brain },
    { label: 'Feedback Quality', value: '88%', icon: RotateCcw },
    { label: 'State Stability', value: '94%', icon: Layers },
  ];

  return (
    <aside
      style={{
        width: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
        userSelect: 'none',
        overflowY: 'auto',
        paddingRight: '2px',
      }}
    >
      {/* 1. CARD: SYSTEM OVERVIEW (Dark Navy Rounded Card Matching Reference) */}
      <div
        style={{
          backgroundColor: '#0B1325',
          borderRadius: '14px',
          padding: '14px 16px',
          border: '1px solid #1E293B',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.05em' }}>
          SYSTEM OVERVIEW
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {systemMetrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon className="w-3.5 h-3.5 text-amber-500" />
                  <span style={{ color: '#94A3B8' }}>{m.label}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#38BDF8', fontWeight: 700, fontFamily: 'monospace' }}>
                    {m.value}
                  </span>
                  {renderSparkline()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CARD: CUBiO CORE STATUS (With 3D Gold Cube & Metadata) */}
      <div
        style={{
          backgroundColor: '#0B1325',
          borderRadius: '14px',
          padding: '14px 16px',
          border: '1px solid #1E293B',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.05em' }}>
          CUBiO CORE STATUS
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Glowing Golden Cube SVG */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '10px',
              backgroundColor: '#050B18',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              shrink: 0,
            }}
          >
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
              <polygon points="50,15 85,35 50,55 15,35" fill="none" stroke="#F59E0B" strokeWidth="3.5" />
              <polygon points="15,35 50,55 50,90 15,70" fill="none" stroke="#D97706" strokeWidth="3.5" />
              <polygon points="50,55 85,35 85,70 50,90" fill="none" stroke="#B45309" strokeWidth="3.5" />
              <circle cx="50" cy="55" r="8" fill="#FDE68A" />
              <circle cx="50" cy="55" r="18" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
            </svg>
          </div>

          {/* Specs Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, fontSize: '10.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Core ID</span>
              <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>CUBIO-CORE-001</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Status</span>
              <strong style={{ color: '#10B981', fontFamily: 'monospace' }}>STABLE</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Dimensions Active</span>
              <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>7 / 12</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Total States</span>
              <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>128,512</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Superposition Size</span>
              <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>512</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Uptime</span>
              <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>24d 16h 32m</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CARD: QUICK ACTIONS (Matching Reference Grid & Advanced Console) */}
      <div
        style={{
          backgroundColor: '#0B1325',
          borderRadius: '14px',
          padding: '14px 16px',
          border: '1px solid #1E293B',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.05em' }}>
          QUICK ACTIONS
        </div>

        {/* 2x2 Grid of Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {/* New Input */}
          <button
            onClick={() => onQuickAction?.('NEW_INPUT')}
            style={{
              padding: '10px 8px',
              borderRadius: '8px',
              backgroundColor: '#060B18',
              border: '1px solid #1E293B',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#F8FAFC' }}>New Input</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748B' }}>Add new data stream</span>
          </button>

          {/* Run Analysis */}
          <button
            onClick={() => onQuickAction?.('RUN_ANALYSIS')}
            style={{
              padding: '10px 8px',
              borderRadius: '8px',
              backgroundColor: '#060B18',
              border: '1px solid #1E293B',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Play className="w-3.5 h-3.5 text-amber-500" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#F8FAFC' }}>Run Analysis</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748B' }}>Analyze current states</span>
          </button>

          {/* View Memory */}
          <button
            onClick={() => onQuickAction?.('VIEW_MEMORY')}
            style={{
              padding: '10px 8px',
              borderRadius: '8px',
              backgroundColor: '#060B18',
              border: '1px solid #1E293B',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Database className="w-3.5 h-3.5 text-amber-500" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#F8FAFC' }}>View Memory</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748B' }}>Browse memory records</span>
          </button>

          {/* System Settings */}
          <button
            onClick={onOpenSettings}
            style={{
              padding: '10px 8px',
              borderRadius: '8px',
              backgroundColor: '#060B18',
              border: '1px solid #1E293B',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Settings className="w-3.5 h-3.5 text-amber-500" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#F8FAFC' }}>System Settings</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748B' }}>Configure engine</span>
          </button>
        </div>

        {/* Large Prominent Advanced Console Button */}
        <button
          onClick={onOpenLogs}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 16px',
            borderRadius: '8px',
            backgroundColor: '#060B18',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)',
            color: '#FDE68A',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            marginTop: '2px',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>&gt;_ Advanced Console</span>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </aside>
  );
};
