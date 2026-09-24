/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 10D: Minimal Context Inspector Panel (Blue / Cyan Theme)
 */

import React from 'react';
import {
  SlidersHorizontal,
} from 'lucide-react';
import { CubiODimension, CubiOHarmonic369 } from '../../types';
import { Spatial3DModelMetadata } from '../../studio/services/spatialModelParser';
import { ActivityStep } from '../../studio/tools/types';
import { SpatialActivityRail } from '../../studio/tools/SpatialActivityRail';

export interface ContextPanelProps {
  readonly activeDimension: CubiODimension;
  readonly onSelectDimension: (dim: CubiODimension) => void;
  readonly harmonic: CubiOHarmonic369;
  readonly activeStateId: string;
  readonly memoryCount: number;
  readonly peerCount: number;
  readonly importedModel?: Spatial3DModelMetadata | null;
  readonly activitySteps?: readonly ActivityStep[];
  readonly isProcessing?: boolean;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  activeDimension,
  onSelectDimension,
  harmonic,
  activeStateId,
  memoryCount,
  peerCount,
  importedModel,
  activitySteps,
  isProcessing = false,
}) => {


  const dimensions: CubiODimension[] = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#070D1A',
        borderLeft: '1px solid #131E35',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        overflowY: 'auto',
        padding: '20px 16px',
        gap: '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#F8FAFC',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Current Context
        </span>
      </div>

      {/* 3D Model Telemetry Widget (If imported) */}
      {importedModel && (
        <div
          style={{
            backgroundColor: '#0D152D',
            border: '1px solid #0284C7',
            borderRadius: '10px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '11.5px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '4px' }}>
            <span style={{ fontWeight: 700, color: '#38BDF8' }}>3D Model</span>
            <span style={{ fontFamily: 'monospace', color: '#10B981', fontWeight: 700 }}>{importedModel.fileFormat}</span>
          </div>
          <div style={{ color: '#F8FAFC', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {importedModel.fileName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
            <span>Vertices</span>
            <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>{importedModel.vertexCount.toLocaleString()}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
            <span>Faces</span>
            <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>{importedModel.faceCount.toLocaleString()}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
            <span>Size (mm)</span>
            <strong style={{ color: '#F8FAFC', fontFamily: 'monospace' }}>
              {importedModel.dimensions.width}×{importedModel.dimensions.height}×{importedModel.dimensions.depth}
            </strong>
          </div>
        </div>
      )}

      {/* 1. Dimension Selector (Height: 32px, Text: 11px) */}
      <div
        style={{
          backgroundColor: '#0D152D',
          border: '1px solid #1E293B',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500 }}>Active Dimension</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace' }}>
            {activeDimension}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
          {dimensions.map((dim) => {
            const isSelected = activeDimension === dim;
            return (
              <button
                key={dim}
                onClick={() => onSelectDimension(dim)}
                style={{
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? '#2563EB' : 'transparent',
                  border: isSelected ? '1px solid #3B82F6' : '1px solid #1E293B',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 500,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {dim}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Active State Node */}
      <div
        style={{
          backgroundColor: '#0D152D',
          border: '1px solid #1E293B',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500 }}>Active State</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', fontFamily: 'monospace' }}>
          {activeStateId}
        </span>
      </div>

      {/* 3. 369 Harmonic Context */}
      <div
        style={{
          backgroundColor: '#0D152D',
          border: '1px solid #1E293B',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500 }}>369 Harmonic</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#64748B' }}>Flux</span>
          <span style={{ color: '#38BDF8', fontFamily: 'monospace', fontWeight: 700 }}>{harmonic.harmonicFlux}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#64748B' }}>Phase</span>
          <span style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>{harmonic.phaseShift}°</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#64748B' }}>Resonance</span>
          <span style={{ color: '#10B981', fontFamily: 'monospace', fontWeight: 700 }}>{harmonic.resonanceScore}%</span>
        </div>
      </div>

      {/* 4. CAS Memory Context */}
      <div
        style={{
          backgroundColor: '#0D152D',
          border: '1px solid #1E293B',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500 }}>CAS Memory</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#64748B' }}>Indexed</span>
          <span style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>{memoryCount} anchors</span>
        </div>
      </div>

      {/* 5. Network Mesh Context */}
      <div
        style={{
          backgroundColor: '#0D152D',
          border: '1px solid #1E293B',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500 }}>Network Mesh</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#64748B' }}>Peers</span>
          <span style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>{peerCount} peers</span>
        </div>
      </div>

      {/* 6. Spatial Pipeline Activity Rail */}
      {activitySteps && activitySteps.length > 0 && (
        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
          <SpatialActivityRail steps={activitySteps} isProcessing={isProcessing} />
        </div>
      )}
    </aside>
  );
};

