/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Interaction Toolbar UI Component
 *
 * Controls for SELECT, MOVE, ROTATE, SCALE, RESET, UNDO, REDO, CANCEL, COMMIT.
 * All controls operate only on R8 downstream state (ΔReality = 0).
 */

import React from 'react';
import { RealityInteractionSession } from '../types';

interface R8InteractionToolbarProps {
  session: RealityInteractionSession;
  canUndo: boolean;
  canRedo: boolean;
  hasPreview: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onCancel: () => void;
  onCommit: () => void;
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export const R8InteractionToolbar: React.FC<R8InteractionToolbarProps> = ({
  session,
  canUndo,
  canRedo,
  hasPreview,
  onUndo,
  onRedo,
  onReset,
  onCancel,
  onCommit,
  activeTool,
  onToolChange,
}) => {
  const tools = [
    { id: 'SELECT', label: 'Select', icon: '⊹' },
    { id: 'MOVE', label: 'Move', icon: '✥' },
    { id: 'ROTATE', label: 'Rotate', icon: '↻' },
    { id: 'SCALE', label: 'Scale', icon: '⇱' },
  ];

  return (
    <div style={{
      display: 'flex', gap: '6px', padding: '8px 20px',
      backgroundColor: '#090D16', borderBottom: '1px solid #1E293B',
      alignItems: 'center', flexWrap: 'wrap', fontSize: '12px',
    }}>
      <span style={{ color: '#F472B6', fontWeight: 'bold', marginRight: '6px', fontSize: '11px' }}>
        R8 INTERACTION
      </span>

      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          style={toolBtn(activeTool === tool.id)}
        >
          {tool.icon} {tool.label}
        </button>
      ))}

      <div style={divider} />

      <button onClick={onReset} style={actionBtn}>
        ⟲ Reset
      </button>

      <div style={divider} />

      <button onClick={onUndo} disabled={!canUndo} style={undoRedoBtn(canUndo)}>
        ↩ Undo
      </button>
      <button onClick={onRedo} disabled={!canRedo} style={undoRedoBtn(canRedo)}>
        ↪ Redo
      </button>

      <div style={divider} />

      <button onClick={onCancel} disabled={!hasPreview} style={cancelBtn(hasPreview)}>
        ✕ Cancel
      </button>
      <button onClick={onCommit} disabled={!hasPreview} style={commitBtn(hasPreview)}>
        ✓ Commit
      </button>

      <div style={{ flex: 1 }} />

      <span style={{ color: '#64748B', fontSize: '10px' }}>
        State: {session.state} | History: {session.history.length}
      </span>
    </div>
  );
};

const toolBtn = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
  backgroundColor: active ? '#7C3AED' : '#1E293B',
  border: active ? '1px solid #A78BFA' : '1px solid #334155',
  color: active ? '#FFFFFF' : '#94A3B8',
});

const actionBtn: React.CSSProperties = {
  padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
  backgroundColor: '#1E293B', border: '1px solid #334155', color: '#E2E8F0',
};

const undoRedoBtn = (enabled: boolean): React.CSSProperties => ({
  padding: '4px 10px', borderRadius: '4px', cursor: enabled ? 'pointer' : 'default', fontSize: '11px',
  backgroundColor: '#1E293B', border: '1px solid #334155',
  color: enabled ? '#38BDF8' : '#475569', opacity: enabled ? 1 : 0.5,
});

const cancelBtn = (enabled: boolean): React.CSSProperties => ({
  padding: '4px 10px', borderRadius: '4px', cursor: enabled ? 'pointer' : 'default', fontSize: '11px',
  backgroundColor: enabled ? '#7F1D1D' : '#1E293B', border: '1px solid #334155',
  color: enabled ? '#FCA5A5' : '#475569', opacity: enabled ? 1 : 0.5,
});

const commitBtn = (enabled: boolean): React.CSSProperties => ({
  padding: '4px 10px', borderRadius: '4px', cursor: enabled ? 'pointer' : 'default', fontSize: '11px',
  backgroundColor: enabled ? '#065F46' : '#1E293B', border: '1px solid #334155',
  color: enabled ? '#6EE7B7' : '#475569', opacity: enabled ? 1 : 0.5,
});

const divider: React.CSSProperties = {
  width: '1px', height: '18px', backgroundColor: '#334155', margin: '0 4px',
};
