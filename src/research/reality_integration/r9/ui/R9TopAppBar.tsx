/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Production-Grade Top Application Bar
 *
 * Provides: Title branding, Workspace metadata, Reality anchor badge [5,3,6],
 * Save/Load/Export/Import, Reset, Undo/Redo, Snapping status, Sync indicator,
 * and strict epistemic invariant display (ΔReality = 0, σ² = 0).
 */

import React from 'react';
import {
  Save,
  FolderOpen,
  Download,
  Upload,
  RotateCcw,
  Undo2,
  Redo2,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Camera,
  Grid as GridIcon,
  LogOut,
} from 'lucide-react';
import { GeometryBindingState } from '../types';

export interface R9TopAppBarProps {
  readonly workspaceName: string;
  readonly bindingState: GeometryBindingState;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  readonly onReset: () => void;
  readonly onSave: () => void;
  readonly onLoad: () => void;
  readonly onExportJson: () => void;
  readonly onImportJson: () => void;
  readonly onExit?: () => void;
  readonly cameraMode: 'PERSPECTIVE' | 'ORTHOGRAPHIC';
  readonly onToggleCameraMode: () => void;
  readonly shadingMode: 'SOLID' | 'WIREFRAME' | 'SOLID_WIREFRAME' | 'XRAY';
  readonly onChangeShadingMode: (mode: 'SOLID' | 'WIREFRAME' | 'SOLID_WIREFRAME' | 'XRAY') => void;
  readonly isSnappingActive: boolean;
  readonly onToggleSnapping: () => void;
  readonly activeSnapMode: string;
}

export const R9TopAppBar: React.FC<R9TopAppBarProps> = ({
  workspaceName,
  bindingState,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onSave,
  onLoad,
  onExportJson,
  onImportJson,
  onExit,
  cameraMode,
  onToggleCameraMode,
  shadingMode,
  onChangeShadingMode,
  isSnappingActive,
  onToggleSnapping,
  activeSnapMode,
}) => {
  const btnStyle = (disabled = false, active = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 9px',
    backgroundColor: disabled ? 'transparent' : active ? '#4C1D95' : '#1E293B',
    color: disabled ? '#475569' : active ? '#E9D5FF' : '#E2E8F0',
    border: '1px solid ' + (active ? '#8B5CF6' : '#334155'),
    borderRadius: '5px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'all 0.15s ease',
  });

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
      {/* Left: Branding & Workspace Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(124, 58, 237, 0.5)',
            }}
          >
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', color: '#F8FAFC' }}>
            3D MEMORY STUDIO
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#312E81',
              color: '#A5B4FC',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            WORKSPACE R9
          </span>
        </div>

        <div style={{ width: '1px', height: '18px', backgroundColor: '#334155' }} />

        {/* File & Workspace Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button style={btnStyle()} onClick={onSave} title="Save Workspace Snapshot">
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            <span>Save</span>
          </button>
          <button style={btnStyle()} onClick={onExportJson} title="Export R9 Schema JSON">
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export</span>
          </button>
          <button style={btnStyle()} onClick={onImportJson} title="Import R9 Schema JSON">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Import</span>
          </button>
          <button style={btnStyle()} onClick={onReset} title="Reset Workspace Geometry">
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset</span>
          </button>
        </div>

        <div style={{ width: '1px', height: '18px', backgroundColor: '#334155' }} />

        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button style={btnStyle(!canUndo)} disabled={!canUndo} onClick={onUndo} title="Undo (Ctrl+Z)">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button style={btnStyle(!canRedo)} disabled={!canRedo} onClick={onRedo} title="Redo (Ctrl+Y)">
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Epistemic Anchor & Invariant Display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Canonical Reality Anchor */}
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
          title="Authoritative Reality Reference Coordinate (Immutable)"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span style={{ color: '#6EE7B7', fontWeight: 600 }}>REALITY ANCHOR:</span>
          <span style={{ color: '#34D399', fontWeight: 800 }}>[5, 3, 6]</span>
        </div>

        {/* Primary Invariant Badge */}
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
          title="Every downstream workspace operation maintains ΔReality = 0"
        >
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>ΔREALITY = 0</span>
        </div>

        {/* Sync Status Badge */}
        <div
          style={{
            padding: '3px 8px',
            borderRadius: '5px',
            backgroundColor: bindingState.staleState === 'SYNCED' ? '#064E3B' : '#7F1D1D',
            border: '1px solid ' + (bindingState.staleState === 'SYNCED' ? '#10B981' : '#EF4444'),
            fontSize: '11px',
            fontWeight: 800,
            color: bindingState.staleState === 'SYNCED' ? '#6EE7B7' : '#FCA5A5',
          }}
        >
          {bindingState.staleState}
        </div>
      </div>

      {/* Right: Viewport Quick Options & Exit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Shading Mode Dropdown / Button */}
        <div style={{ display: 'flex', backgroundColor: '#1E293B', borderRadius: '5px', border: '1px solid #334155', padding: '2px' }}>
          <button
            onClick={() => onChangeShadingMode('SOLID')}
            style={{
              padding: '3px 7px',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '3px',
              backgroundColor: shadingMode === 'SOLID' ? '#7C3AED' : 'transparent',
              color: shadingMode === 'SOLID' ? '#FFF' : '#94A3B8',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            SOLID
          </button>
          <button
            onClick={() => onChangeShadingMode('SOLID_WIREFRAME')}
            style={{
              padding: '3px 7px',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '3px',
              backgroundColor: shadingMode === 'SOLID_WIREFRAME' ? '#7C3AED' : 'transparent',
              color: shadingMode === 'SOLID_WIREFRAME' ? '#FFF' : '#94A3B8',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            WIRE+
          </button>
          <button
            onClick={() => onChangeShadingMode('WIREFRAME')}
            style={{
              padding: '3px 7px',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '3px',
              backgroundColor: shadingMode === 'WIREFRAME' ? '#7C3AED' : 'transparent',
              color: shadingMode === 'WIREFRAME' ? '#FFF' : '#94A3B8',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            WIRE
          </button>
        </div>

        {/* Camera Projection Toggle */}
        <button style={btnStyle(false, cameraMode === 'ORTHOGRAPHIC')} onClick={onToggleCameraMode} title="Toggle Perspective / Orthographic Camera">
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span>{cameraMode === 'PERSPECTIVE' ? 'PERSP' : 'ORTHO'}</span>
        </button>

        {/* Snapping Toggle */}
        <button style={btnStyle(false, isSnappingActive)} onClick={onToggleSnapping} title={`Snapping: ${isSnappingActive ? activeSnapMode : 'OFF'}`}>
          <GridIcon className={`w-3.5 h-3.5 ${isSnappingActive ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>SNAP: {isSnappingActive ? activeSnapMode : 'OFF'}</span>
        </button>

        {/* Exit Workspace */}
        {onExit && (
          <button style={{ ...btnStyle(), backgroundColor: '#1E1B4B', borderColor: '#4338CA' }} onClick={onExit} title="Exit R9 Workspace">
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Exit</span>
          </button>
        )}
      </div>
    </header>
  );
};
