/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 7: Spatial Tool Bar Component
 *
 * Clean floating bar for selecting:
 * [ Select | Measure | Inspect | Slice | Transform ]
 */

import React from 'react';
import {
  MousePointer,
  Ruler,
  Scan,
  Scissors,
  Move3d,
} from 'lucide-react';
import { SpatialToolMode } from './types';

export interface SpatialToolBarProps {
  readonly activeTool: SpatialToolMode;
  readonly onSelectTool: (tool: SpatialToolMode) => void;
  readonly hasImportedModel?: boolean;
}

export const SpatialToolBar: React.FC<SpatialToolBarProps> = ({
  activeTool,
  onSelectTool,
  hasImportedModel = false,
}) => {
  const tools: Array<{ id: SpatialToolMode; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'SELECT', label: 'Select', icon: MousePointer },
    { id: 'MEASURE', label: 'Measure', icon: Ruler },
    { id: 'INSPECT', label: 'Inspect', icon: Scan },
    { id: 'SLICE', label: 'Slice', icon: Scissors },
    { id: 'TRANSFORM', label: 'Transform', icon: Move3d },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: '#070D1A',
        border: '1px solid #1E293B',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        userSelect: 'none',
      }}
    >
      {tools.map((t) => {
        const isSelected = activeTool === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: isSelected ? '#0284C7' : 'transparent',
              border: isSelected ? '1px solid #38BDF8' : '1px solid transparent',
              color: isSelected ? '#FFFFFF' : '#94A3B8',
              fontSize: '12px',
              fontWeight: isSelected ? 700 : 500,
              fontFamily: 'Inter, system-ui, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isSelected ? '0 2px 8px rgba(56, 189, 248, 0.25)' : 'none',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};
