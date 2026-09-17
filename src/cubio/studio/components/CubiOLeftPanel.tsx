/**
 * CubiO — Universal Spatial Operating Environment
 * Exact Reference Left Sidebar Navigation
 */

import React from 'react';
import {
  LayoutDashboard,
  Eye,
  Zap,
  Layers,
  Sparkles,
  Database,
  Brain,
  Settings,
  TrendingUp,
  Crosshair,
  RotateCcw,
  Box,
  SlidersHorizontal,
  FolderTree,
  Sliders,
  FileText,
  ChevronRight,
} from 'lucide-react';
import {
  CubiOState,
  CubiOMemoryNode,
  CubiOHarmonic369,
  CubiODimension,
  CubiONetworkPeer,
  CubiOFileNode,
} from '../../types';

export interface CubiOLeftPanelProps {
  readonly activeTab: string;
  readonly onSelectTab: (tab: any) => void;
  readonly states: readonly (CubiOState | any)[];
  readonly activeStateId: string;
  readonly onSelectState: (stateId: string) => void;
  readonly memories: readonly CubiOMemoryNode[];
  readonly harmonic: CubiOHarmonic369;
  readonly activeDimension: CubiODimension;
  readonly onSelectDimension: (dim: CubiODimension) => void;
  readonly peers: readonly CubiONetworkPeer[];
  readonly files: readonly CubiOFileNode[];
}

export const CubiOLeftPanel: React.FC<CubiOLeftPanelProps> = ({
  activeTab,
  onSelectTab,
  states,
  activeStateId,
  onSelectState,
  memories,
  harmonic,
  activeDimension,
  onSelectDimension,
  peers,
  files,
}) => {
  const mainNavItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'PERCEPTION', label: 'Perception', icon: Eye },
    { id: '369_VIEW', label: 'Dimension View', icon: Zap },
    { id: 'SUPERPOSITION', label: 'Superposition', icon: Layers },
    { id: 'PATTERNS', label: 'Patterns', icon: Sparkles },
    { id: 'MEMORY', label: 'Memory', icon: Database },
    { id: 'LEARNING', label: 'Learning', icon: Brain },
    { id: 'REASONING', label: 'Reasoning', icon: Settings },
    { id: 'PREDICTION', label: 'Prediction', icon: TrendingUp },
    { id: 'DECISION', label: 'Decision', icon: Crosshair },
    { id: 'FEEDBACK', label: 'Feedback', icon: RotateCcw },
  ];

  const systemNavItems = [
    { id: 'CUBIO_CORE', label: 'CubiO Dimension', icon: Box },
    { id: 'DIMENSIONS', label: 'Manifolds', icon: SlidersHorizontal },
    { id: 'STATE_SPACE', label: 'State Space', icon: FolderTree },
    { id: 'CONFIGURATIONS', label: 'Configurations', icon: Sliders },
    { id: 'LOGS', label: 'Logs', icon: FileText },
  ];


  const isCurrentActive = (id: string) => {
    if (activeTab === id) return true;
    if (id === '369_VIEW' && activeTab === '369') return true;
    if (id === 'DIMENSIONS' && activeTab === 'DIMENSION') return true;
    if (id === 'STATE_SPACE' && activeTab === 'STATES') return true;
    if (id === 'MEMORY' && activeTab === 'MEMORY') return true;
    if (id === 'DASHBOARD' && (activeTab === 'DASHBOARD' || !activeTab)) return true;
    return false;
  };

  return (
    <aside
      style={{
        width: '210px',
        backgroundColor: '#070D1A',
        borderRight: '1px solid #131E35',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        overflow: 'hidden',
        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Scrollable Nav Items */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* MAIN SECTION */}
        <div>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#64748B',
              textTransform: 'uppercase',
              padding: '0 8px 6px 8px',
              fontFamily: 'monospace',
            }}
          >
            MAIN
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const selected = isCurrentActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === '369_VIEW') onSelectTab('369');
                    else if (item.id === 'STATE_SPACE') onSelectTab('STATES');
                    else onSelectTab(item.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    backgroundColor: selected ? 'rgba(217, 119, 6, 0.15)' : 'transparent',
                    border: selected ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                    color: selected ? '#FDE68A' : '#94A3B8',
                    fontWeight: selected ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.12s ease',
                    boxShadow: selected ? '0 0 10px rgba(245, 158, 11, 0.12)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon
                      className={`w-4 h-4 ${selected ? 'text-amber-400' : 'text-slate-400'}`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {selected && (
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SYSTEM SECTION */}
        <div>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#64748B',
              textTransform: 'uppercase',
              padding: '0 8px 6px 8px',
              fontFamily: 'monospace',
            }}
          >
            SYSTEM
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {systemNavItems.map((item) => {
              const Icon = item.icon;
              const selected = isCurrentActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'DIMENSIONS') onSelectTab('DIMENSION');
                    else if (item.id === 'STATE_SPACE') onSelectTab('STATES');
                    else onSelectTab(item.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    backgroundColor: selected ? 'rgba(217, 119, 6, 0.15)' : 'transparent',
                    border: selected ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                    color: selected ? '#FDE68A' : '#94A3B8',
                    fontWeight: selected ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon
                      className={`w-4 h-4 ${selected ? 'text-amber-400' : 'text-slate-400'}`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {selected && (
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM CARD: CubiO CORE v1.0.0 (Matching Reference) */}
      <div
        style={{
          margin: '10px',
          padding: '12px',
          borderRadius: '12px',
          backgroundColor: '#0B1325',
          border: '1px solid rgba(217, 119, 6, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#F8FAFC' }}>
            CubiO CORE
          </span>
          <span style={{ fontSize: '9.5px', color: '#64748B', fontFamily: 'monospace' }}>
            v1.0.0
          </span>
        </div>

        {/* Golden Mini Cube Graphic */}
        <div style={{ width: '48px', height: '48px', margin: '2px 0' }}>
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
            <polygon
              points="50,15 85,35 50,55 15,35"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="4"
            />
            <polygon
              points="15,35 50,55 50,92 15,72"
              fill="none"
              stroke="#D97706"
              strokeWidth="4"
            />
            <polygon
              points="50,55 85,35 85,72 50,92"
              fill="none"
              stroke="#B45309"
              strokeWidth="4"
            />
            <circle cx="50" cy="55" r="7" fill="#FDE68A" />
            <circle cx="50" cy="55" r="14" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        </div>

        {/* Operational Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 6px #10B981',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '9.5px', color: '#6EE7B7', fontWeight: 700, fontFamily: 'monospace' }}>
            All Systems Operational
          </span>
        </div>
      </div>
    </aside>
  );
};
