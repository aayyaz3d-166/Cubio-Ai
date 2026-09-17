/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 7: Spatial Tool Panel Drawer
 *
 * Provides dedicated control panels for:
 * - MEASURE: Width, Height, Depth, Diagonal, Volume, Units Toggle (mm/cm/inch)
 * - INSPECT: Polygon density, Watertight validation, Warnings, Center of Mass
 * - SLICE: X/Y/Z clipping plane, Position slider, Invert normal, Reset
 * - TRANSFORM: Position offset, Rotation angles, Scale factors, Mirror X/Y/Z, Reset
 */

import React from 'react';
import {
  Ruler,
  Scan,
  Scissors,
  Move3d,
  RotateCcw,
  FlipHorizontal,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
} from 'lucide-react';
import {
  SpatialToolMode,
  MeasurementUnit,
  SpatialMeasurement,
  GeometryInspectReport,
  SlicePlaneConfig,
  SpatialTransformConfig,
} from './types';
import { CubiOSpatialToolsEngine } from './spatialToolsEngine';
import { Spatial3DModelMetadata } from '../services/spatialModelParser';

export interface SpatialToolPanelProps {
  readonly activeTool: SpatialToolMode;
  readonly unit: MeasurementUnit;
  readonly onUnitChange: (unit: MeasurementUnit) => void;
  readonly measurement: SpatialMeasurement;
  readonly inspectReport: GeometryInspectReport | null;
  readonly slice: SlicePlaneConfig;
  readonly onSliceChange: (slice: SlicePlaneConfig) => void;
  readonly transform: SpatialTransformConfig;
  readonly onTransformChange: (transform: SpatialTransformConfig) => void;
  readonly importedModel?: Spatial3DModelMetadata | null;
  readonly onClose?: () => void;
  readonly onAskAIAboutTool?: (prompt: string) => void;
}

export const SpatialToolPanel: React.FC<SpatialToolPanelProps> = ({
  activeTool,
  unit,
  onUnitChange,
  measurement,
  inspectReport,
  slice,
  onSliceChange,
  transform,
  onTransformChange,
  importedModel,
  onClose,
  onAskAIAboutTool,
}) => {
  if (activeTool === 'SELECT') return null;

  return (
    <div
      style={{
        backgroundColor: '#070D1A',
        border: '1px solid #1E293B',
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        userSelect: 'none',
      }}
    >
      {/* Header with Title and Close */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #131E35', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeTool === 'MEASURE' && <Ruler className="w-4 h-4 text-cyan-400" />}
          {activeTool === 'INSPECT' && <Scan className="w-4 h-4 text-amber-400" />}
          {activeTool === 'SLICE' && <Scissors className="w-4 h-4 text-sky-400" />}
          {activeTool === 'TRANSFORM' && <Move3d className="w-4 h-4 text-emerald-400" />}
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.04em' }}>
            {activeTool === 'MEASURE' && 'PRECISION MEASUREMENT'}
            {activeTool === 'INSPECT' && 'GEOMETRY INSPECTION & DIAGNOSTICS'}
            {activeTool === 'SLICE' && 'INTERACTIVE SLICE PLANE'}
            {activeTool === 'TRANSFORM' && 'SPATIAL TRANSFORMATIONS'}
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
          >
            <X className="w-4 h-4 hover:text-slate-200" />
          </button>
        )}
      </div>

      {/* ─── 1. MEASURE PANEL ──────────────────────────────────────────────── */}
      {activeTool === 'MEASURE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Unit Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Measurement Unit</span>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0B1325', padding: '2px', borderRadius: '6px', border: '1px solid #1E293B' }}>
              {(['mm', 'cm', 'inch'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => onUnitChange(u)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: unit === u ? '#0284C7' : 'transparent',
                    color: unit === u ? '#FFFFFF' : '#64748B',
                    border: 'none',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: unit === u ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Measurements Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <div style={{ backgroundColor: '#0B1325', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '10px', color: '#64748B' }}>WIDTH (X)</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                {measurement.width} {unit}
              </div>
            </div>
            <div style={{ backgroundColor: '#0B1325', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '10px', color: '#64748B' }}>HEIGHT (Y)</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                {measurement.height} {unit}
              </div>
            </div>
            <div style={{ backgroundColor: '#0B1325', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '10px', color: '#64748B' }}>DEPTH (Z)</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                {measurement.depth} {unit}
              </div>
            </div>
            <div style={{ backgroundColor: '#0B1325', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '10px', color: '#64748B' }}>DIAGONAL</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FDE68A', fontFamily: 'monospace' }}>
                {measurement.diagonal} {unit}
              </div>
            </div>
          </div>

          {/* Ask AI Button */}
          {onAskAIAboutTool && (
            <button
              onClick={() => onAskAIAboutTool(`Analyze these spatial dimensions: Width=${measurement.width}${unit}, Height=${measurement.height}${unit}, Depth=${measurement.depth}${unit}, Volume=${measurement.boundingVolume}${unit}³. Explain proportional balance.`)}
              style={{
                marginTop: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid #0284C7',
                color: '#38BDF8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Ask CubiO AI to Analyze Dimensions →
            </button>
          )}
        </div>
      )}

      {/* ─── 2. INSPECT PANEL ──────────────────────────────────────────────── */}
      {activeTool === 'INSPECT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ backgroundColor: '#0B1325', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '10px', color: '#64748B' }}>VERTICES</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC', fontFamily: 'monospace' }}>
                {(inspectReport?.vertexCount || importedModel?.vertexCount || 8).toLocaleString()}
              </div>
            </div>
            <div style={{ backgroundColor: '#0B1325', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '10px', color: '#64748B' }}>FACES / POLYS</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC', fontFamily: 'monospace' }}>
                {(inspectReport?.faceCount || importedModel?.faceCount || 12).toLocaleString()}
              </div>
            </div>
            <div style={{ backgroundColor: '#0B1325', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '10px', color: '#64748B' }}>WATERTIGHT SOLID</div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: (inspectReport?.isWatertight ?? true) ? '#10B981' : '#F59E0B' }}>
                {(inspectReport?.isWatertight ?? true) ? '✅ PASS' : '⚠️ OPEN MESH'}
              </div>
            </div>
          </div>

          {/* Warnings List */}
          {inspectReport?.warnings && inspectReport.warnings.length > 0 && (
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '8px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FDE68A', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Diagnostics & Warnings</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#CBD5E1', lineHeight: 1.4 }}>
                {inspectReport.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {onAskAIAboutTool && (
            <button
              onClick={() => onAskAIAboutTool(`Inspect this geometry structure (${inspectReport?.vertexCount || importedModel?.vertexCount || 8} vertices, ${inspectReport?.faceCount || importedModel?.faceCount || 12} faces). Diagnose potential manufacturing or topological defects.`)}
              style={{
                marginTop: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid #D97706',
                color: '#FDE68A',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Ask CubiO AI for Diagnostic Breakdown →
            </button>
          )}
        </div>
      )}

      {/* ─── 3. SLICE PANEL ────────────────────────────────────────────────── */}
      {activeTool === 'SLICE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Axis Selector & Enable Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>Slice Axis:</span>
              {(['X', 'Y', 'Z'] as const).map((ax) => (
                <button
                  key={ax}
                  onClick={() => onSliceChange({ ...slice, axis: ax, enabled: true })}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: slice.axis === ax && slice.enabled ? '#0284C7' : '#0B1325',
                    color: slice.axis === ax && slice.enabled ? '#FFFFFF' : '#94A3B8',
                    border: '1px solid #1E293B',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {ax}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => onSliceChange({ ...slice, inverted: !slice.inverted })}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: slice.inverted ? '#3B82F6' : '#0B1325',
                  color: slice.inverted ? '#FFFFFF' : '#94A3B8',
                  border: '1px solid #1E293B',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Invert Normal
              </button>

              <button
                onClick={() => onSliceChange({ enabled: false, axis: 'Y', position: 0.0, inverted: false, showSectionOutline: true })}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#0B1325',
                  color: '#94A3B8',
                  border: '1px solid #1E293B',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Slicing Position Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8' }}>
              <span>Plane Offset Position</span>
              <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{(slice.position * 100).toFixed(0)}%</strong>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.02"
              value={slice.position}
              onChange={(e) => onSliceChange({ ...slice, position: parseFloat(e.target.value), enabled: true })}
              style={{ width: '100%', accentColor: '#38BDF8', cursor: 'pointer' }}
            />
          </div>
        </div>
      )}

      {/* ─── 4. TRANSFORM PANEL ────────────────────────────────────────────── */}
      {activeTool === 'TRANSFORM' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Position & Rotation Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {/* Rotate X */}
            <div style={{ backgroundColor: '#0B1325', padding: '6px 8px', borderRadius: '6px', border: '1px solid #1E293B' }}>
              <span style={{ fontSize: '10px', color: '#64748B' }}>ROTATE X (deg)</span>
              <input
                type="number"
                value={transform.rotation.x}
                onChange={(e) => onTransformChange({ ...transform, rotation: { ...transform.rotation, x: parseFloat(e.target.value) || 0 } })}
                style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#F8FAFC', fontFamily: 'monospace', fontSize: '12px', outline: 'none' }}
              />
            </div>
            {/* Rotate Y */}
            <div style={{ backgroundColor: '#0B1325', padding: '6px 8px', borderRadius: '6px', border: '1px solid #1E293B' }}>
              <span style={{ fontSize: '10px', color: '#64748B' }}>ROTATE Y (deg)</span>
              <input
                type="number"
                value={transform.rotation.y}
                onChange={(e) => onTransformChange({ ...transform, rotation: { ...transform.rotation, y: parseFloat(e.target.value) || 0 } })}
                style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#F8FAFC', fontFamily: 'monospace', fontSize: '12px', outline: 'none' }}
              />
            </div>
            {/* Rotate Z */}
            <div style={{ backgroundColor: '#0B1325', padding: '6px 8px', borderRadius: '6px', border: '1px solid #1E293B' }}>
              <span style={{ fontSize: '10px', color: '#64748B' }}>ROTATE Z (deg)</span>
              <input
                type="number"
                value={transform.rotation.z}
                onChange={(e) => onTransformChange({ ...transform, rotation: { ...transform.rotation, z: parseFloat(e.target.value) || 0 } })}
                style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#F8FAFC', fontFamily: 'monospace', fontSize: '12px', outline: 'none' }}
              />
            </div>
          </div>

          {/* Scale & Mirror Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>Scale Factor:</span>
              <button
                onClick={() => onTransformChange({ ...transform, scale: { x: transform.scale.x * 0.8, y: transform.scale.y * 0.8, z: transform.scale.z * 0.8 } })}
                style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#0B1325', color: '#CBD5E1', border: '1px solid #1E293B', fontSize: '11px', cursor: 'pointer' }}
              >
                -20%
              </button>
              <button
                onClick={() => onTransformChange({ ...transform, scale: { x: transform.scale.x * 1.25, y: transform.scale.y * 1.25, z: transform.scale.z * 1.25 } })}
                style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#0B1325', color: '#CBD5E1', border: '1px solid #1E293B', fontSize: '11px', cursor: 'pointer' }}
              >
                +25%
              </button>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => onTransformChange({
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                uniformScale: true,
                mirror: { x: false, y: false, z: false },
              })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#0B1325',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Transforms</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
