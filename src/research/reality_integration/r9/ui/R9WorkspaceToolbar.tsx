/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Production-Grade Workspace Toolbar
 *
 * Provides grouped tools:
 * Create, Transform, Edit (Extrude/Inset/Bevel/Chamfer/Fillet/Subdivide/Mirror/Array),
 * Booleans (Union/Subtract/Intersect), Measure (Distance/Length/Angle/Area/Volume),
 * Mode toggle (OBJECT MODE vs EDIT MODE: Vertex/Edge/Face), and Snapping Controls.
 */

import React from 'react';
import {
  Box,
  Circle,
  Cylinder,
  Cone,
  Donut,
  Square,
  Sparkles,
  Move,
  RotateCw,
  Maximize2,
  Minimize2,
  Split,
  Combine,
  Scissors,
  Ruler,
  Undo2,
  Redo2,
  Check,
  X,
  Grid,
  Magnet,
  MousePointer,
  Layers,
  Dot,
} from 'lucide-react';
import { GeometryPrimitiveType, BooleanOperationType } from '../types';

export interface R9WorkspaceToolbarProps {
  readonly activeTool: string;
  readonly onSelectTool: (tool: string) => void;
  readonly editMode: 'OBJECT' | 'VERTEX' | 'EDGE' | 'FACE';
  readonly onSetEditMode: (mode: 'OBJECT' | 'VERTEX' | 'EDGE' | 'FACE') => void;
  readonly onCreatePrimitive: (type: GeometryPrimitiveType) => void;
  readonly onCreateCustomMesh: () => void;
  readonly onBooleanOp: (type: BooleanOperationType) => void;
  readonly onExtrude: () => void;
  readonly onInset: () => void;
  readonly onBevel: () => void;
  readonly onChamfer: () => void;
  readonly onFillet: () => void;
  readonly onSubdivide: () => void;
  readonly onMirror: (axis: 'X' | 'Y' | 'Z') => void;
  readonly onArray: () => void;
  readonly onMeasure: (type: 'DISTANCE' | 'LENGTH' | 'ANGLE' | 'AREA' | 'VOLUME') => void;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  readonly onCancelPreview?: () => void;
  readonly onCommitPreview?: () => void;
  readonly hasActivePreview?: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly isSelected: boolean;
  readonly isSnappingActive: boolean;
  readonly onToggleSnapping: () => void;
  readonly snapMode: string;
  readonly onSetSnapMode: (mode: 'GRID' | 'VERTEX' | 'EDGE' | 'FACE' | 'OBJECT') => void;
}

export const R9WorkspaceToolbar: React.FC<R9WorkspaceToolbarProps> = ({
  activeTool,
  onSelectTool,
  editMode,
  onSetEditMode,
  onCreatePrimitive,
  onCreateCustomMesh,
  onBooleanOp,
  onExtrude,
  onInset,
  onBevel,
  onChamfer,
  onFillet,
  onSubdivide,
  onMirror,
  onArray,
  onMeasure,
  onUndo,
  onRedo,
  onCancelPreview,
  onCommitPreview,
  hasActivePreview,
  canUndo,
  canRedo,
  isSelected,
  isSnappingActive,
  onToggleSnapping,
  snapMode,
  onSetSnapMode,
}) => {
  const toolBtn = (name: string, active: boolean, disabled = false, title = ''): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: disabled ? 'transparent' : active ? '#7C3AED' : '#1E293B',
    color: disabled ? '#475569' : active ? '#FFFFFF' : '#CBD5E1',
    border: '1px solid ' + (active ? '#A78BFA' : '#334155'),
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'all 0.12s ease',
  });

  const divider = (
    <div style={{ width: '1px', height: '20px', backgroundColor: '#334155', margin: '0 4px' }} />
  );

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '6px 14px',
        backgroundColor: '#090D16',
        borderBottom: '1px solid #1E293B',
        alignItems: 'center',
        userSelect: 'none',
      }}
    >
      {/* 1. Mode Selector (OBJECT MODE vs EDIT MODE) */}
      <div style={{ display: 'flex', backgroundColor: '#1E293B', borderRadius: '5px', padding: '2px', border: '1px solid #334155' }}>
        <button
          onClick={() => onSetEditMode('OBJECT')}
          style={{
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '3px',
            backgroundColor: editMode === 'OBJECT' ? '#7C3AED' : 'transparent',
            color: editMode === 'OBJECT' ? '#FFF' : '#94A3B8',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          OBJECT
        </button>
        <button
          onClick={() => onSetEditMode('VERTEX')}
          style={{
            padding: '3px 6px',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '3px',
            backgroundColor: editMode === 'VERTEX' ? '#7C3AED' : 'transparent',
            color: editMode === 'VERTEX' ? '#FFF' : '#94A3B8',
            border: 'none',
            cursor: 'pointer',
          }}
          title="Vertex Select Mode"
        >
          VERT
        </button>
        <button
          onClick={() => onSetEditMode('EDGE')}
          style={{
            padding: '3px 6px',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '3px',
            backgroundColor: editMode === 'EDGE' ? '#7C3AED' : 'transparent',
            color: editMode === 'EDGE' ? '#FFF' : '#94A3B8',
            border: 'none',
            cursor: 'pointer',
          }}
          title="Edge Select Mode"
        >
          EDGE
        </button>
        <button
          onClick={() => onSetEditMode('FACE')}
          style={{
            padding: '3px 6px',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '3px',
            backgroundColor: editMode === 'FACE' ? '#7C3AED' : 'transparent',
            color: editMode === 'FACE' ? '#FFF' : '#94A3B8',
            border: 'none',
            cursor: 'pointer',
          }}
          title="Face Select Mode"
        >
          FACE
        </button>
      </div>

      {divider}

      {/* 2. Transform Gizmo Tools */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button style={toolBtn('SELECT', activeTool === 'SELECT')} onClick={() => onSelectTool('SELECT')} title="Selection Tool (Q)">
          <MousePointer className="w-3.5 h-3.5" />
          <span>Select</span>
        </button>
        <button style={toolBtn('MOVE', activeTool === 'MOVE')} onClick={() => onSelectTool('MOVE')} title="Move / Translate (W)">
          <Move className="w-3.5 h-3.5" />
          <span>Move</span>
        </button>
        <button style={toolBtn('ROTATE', activeTool === 'ROTATE')} onClick={() => onSelectTool('ROTATE')} title="Rotate (E)">
          <RotateCw className="w-3.5 h-3.5" />
          <span>Rotate</span>
        </button>
        <button style={toolBtn('SCALE', activeTool === 'SCALE')} onClick={() => onSelectTool('SCALE')} title="Scale (R)">
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Scale</span>
        </button>
      </div>

      {divider}

      {/* 3. Primitive Creation */}
      <div style={{ display: 'flex', gap: '3px' }}>
        <button style={toolBtn('BOX', false)} onClick={() => onCreatePrimitive('BOX')} title="Create Box">
          + Box
        </button>
        <button style={toolBtn('SPHERE', false)} onClick={() => onCreatePrimitive('SPHERE')} title="Create Sphere">
          + Sphere
        </button>
        <button style={toolBtn('CYLINDER', false)} onClick={() => onCreatePrimitive('CYLINDER')} title="Create Cylinder">
          + Cyl
        </button>
        <button style={toolBtn('CONE', false)} onClick={() => onCreatePrimitive('CONE')} title="Create Cone">
          + Cone
        </button>
        <button style={toolBtn('TORUS', false)} onClick={() => onCreatePrimitive('TORUS')} title="Create Torus">
          + Torus
        </button>
        <button style={toolBtn('PLANE', false)} onClick={() => onCreatePrimitive('PLANE')} title="Create Plane">
          + Plane
        </button>
        <button style={toolBtn('CUSTOM', false)} onClick={onCreateCustomMesh} title="Create Custom Mesh">
          + Mesh
        </button>
      </div>

      {divider}

      {/* 4. Mesh Editing Operations */}
      <div style={{ display: 'flex', gap: '3px' }}>
        <button style={toolBtn('EXTRUDE', false, !isSelected)} disabled={!isSelected} onClick={onExtrude} title="Extrude Face">
          Extrude
        </button>
        <button style={toolBtn('INSET', false, !isSelected)} disabled={!isSelected} onClick={onInset} title="Inset Face">
          Inset
        </button>
        <button style={toolBtn('BEVEL', false, !isSelected)} disabled={!isSelected} onClick={onBevel} title="Bevel Edge">
          Bevel
        </button>
        <button style={toolBtn('CHAMFER', false, !isSelected)} disabled={!isSelected} onClick={onChamfer} title="Chamfer Edge">
          Chamfer
        </button>
        <button style={toolBtn('FILLET', false, !isSelected)} disabled={!isSelected} onClick={onFillet} title="Fillet Edge">
          Fillet
        </button>
        <button style={toolBtn('SUBDIVIDE', false, !isSelected)} disabled={!isSelected} onClick={onSubdivide} title="Subdivide Mesh">
          Subdiv
        </button>
        <button style={toolBtn('MIRROR', false, !isSelected)} disabled={!isSelected} onClick={() => onMirror('X')} title="Mirror Across X">
          Mirror
        </button>
        <button style={toolBtn('ARRAY', false, !isSelected)} disabled={!isSelected} onClick={onArray} title="Linear Array">
          Array
        </button>
      </div>

      {divider}

      {/* 5. Boolean Operations */}
      <div style={{ display: 'flex', gap: '3px' }}>
        <button style={toolBtn('UNION', false)} onClick={() => onBooleanOp('UNION')} title="Boolean Union">
          Union
        </button>
        <button style={toolBtn('SUBTRACT', false)} onClick={() => onBooleanOp('SUBTRACT')} title="Boolean Subtract">
          Subtract
        </button>
        <button style={toolBtn('INTERSECT', false)} onClick={() => onBooleanOp('INTERSECT')} title="Boolean Intersect">
          Intersect
        </button>
      </div>

      {divider}

      {/* 6. Measurement Tools */}
      <div style={{ display: 'flex', gap: '3px' }}>
        <button style={toolBtn('DIST', false)} onClick={() => onMeasure('DISTANCE')} title="Measure Euclidean Distance">
          Dist
        </button>
        <button style={toolBtn('AREA', false)} onClick={() => onMeasure('AREA')} title="Measure Surface Area">
          Area
        </button>
        <button style={toolBtn('VOL', false)} onClick={() => onMeasure('VOLUME')} title="Measure Volume">
          Vol
        </button>
      </div>

      {/* 7. Preview Action Buttons (if active) */}
      {hasActivePreview && (
        <>
          {divider}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#F43F5E', letterSpacing: '0.04em' }}>
              PREVIEW:
            </span>
            <button
              onClick={onCancelPreview}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '3px 8px',
                backgroundColor: '#991B1B',
                color: '#FFF',
                border: '1px solid #DC2626',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              onClick={onCommitPreview}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '3px 8px',
                backgroundColor: '#065F46',
                color: '#FFF',
                border: '1px solid #059669',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Check className="w-3.5 h-3.5" /> Commit
            </button>
          </div>
        </>
      )}
    </div>
  );
};
