/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Contextual Right Inspector UI
 *
 * Provides dedicated tabs:
 * OBJECT, TRANSFORM, GEOMETRY, TOPOLOGY, REALITY, LINEAGE, HISTORY.
 * Full numeric controls for workspace transform editing (X/Y/Z),
 * deep topology analysis, and multi-hop epistemic lineage audit.
 */

import React, { useState } from 'react';
import {
  Box,
  Layers,
  Move,
  RotateCw,
  Maximize2,
  ShieldCheck,
  Activity,
  Sparkles,
  History as HistoryIcon,
  Ruler,
  Network,
  Share2,
  Lock,
  Eye,
  Info,
} from 'lucide-react';
import {
  WorkspaceGeometry,
  GeometryBindingState,
  GeometryLineage,
} from '../types';
import { R9GeometryLineageEngine } from '../geometryLineage';
import { R9TopologyEngine } from '../topologyEngine';

export interface R9ContextualInspectorProps {
  readonly geometry: WorkspaceGeometry | null;
  readonly allGeometries: Readonly<Record<string, WorkspaceGeometry>>;
  readonly bindingState: GeometryBindingState;
  readonly onUpdateTransform?: (
    geometryId: string,
    translation: readonly [number, number, number],
    rotation: readonly [number, number, number],
    scale: readonly [number, number, number]
  ) => void;
  readonly onRenameGeometry?: (geometryId: string, newName: string) => void;
}

export const R9ContextualInspector: React.FC<R9ContextualInspectorProps> = ({
  geometry,
  allGeometries,
  bindingState,
  onUpdateTransform,
  onRenameGeometry,
}) => {
  const [activeTab, setActiveTab] = useState<'OBJECT' | 'TRANSFORM' | 'GEOMETRY' | 'TOPOLOGY' | 'REALITY' | 'LINEAGE' | 'HISTORY'>('OBJECT');

  const originColors = (origin: string): { bg: string; text: string; border: string } => {
    switch (origin) {
      case 'OBSERVED':
        return { bg: '#083344', text: '#06B6D4', border: '#0E7490' };
      case 'USER_CONSTRUCTED':
        return { bg: '#451A03', text: '#F59E0B', border: '#B45309' };
      case 'DERIVED':
        return { bg: '#2E1065', text: '#A78BFA', border: '#6D28D9' };
      default:
        return { bg: '#1E293B', text: '#94A3B8', border: '#475569' };
    }
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    marginTop: '12px',
    borderBottom: '1px solid #1E293B',
    paddingBottom: '4px',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    marginBottom: '6px',
  };

  const labelStyle: React.CSSProperties = {
    color: '#64748B',
    fontWeight: 500,
  };

  const valueStyle: React.CSSProperties = {
    color: '#F1F5F9',
    fontFamily: 'monospace',
    fontWeight: 600,
  };

  const inputStyle: React.CSSProperties = {
    width: '60px',
    padding: '3px 6px',
    backgroundColor: '#0F172A',
    border: '1px solid #334155',
    borderRadius: '4px',
    color: '#F8FAFC',
    fontSize: '11px',
    fontFamily: 'monospace',
    textAlign: 'right',
  };

  if (!geometry) {
    return (
      <aside
        style={{
          width: '320px',
          backgroundColor: '#090D16',
          borderLeft: '1px solid #1E293B',
          padding: '20px 16px',
          color: '#64748B',
          fontSize: '12px',
          fontStyle: 'italic',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '8px',
        }}
      >
        <Box className="w-8 h-8 text-slate-700" />
        <div>No geometry selected.</div>
        <div style={{ fontSize: '11px', color: '#475569' }}>
          Select an entity in the viewport or outliner to inspect and modify.
        </div>
      </aside>
    );
  }

  const colors = originColors(geometry.identity.origin);
  const topology = R9TopologyEngine.analyzeTopology(geometry.mesh);
  const lineageTrace = R9GeometryLineageEngine.traceLineage(geometry, allGeometries);

  // Transform Update Handlers
  const handleCoordChange = (axis: 0 | 1 | 2, valStr: string) => {
    if (!onUpdateTransform) return;
    const val = parseFloat(valStr) || 0;
    const curT = [...geometry.transform.translation] as [number, number, number];
    curT[axis] = val;
    onUpdateTransform(geometry.geometryId, curT, geometry.transform.rotation, geometry.transform.scale);
  };

  const handleRotChange = (axis: 0 | 1 | 2, valStr: string) => {
    if (!onUpdateTransform) return;
    const val = parseFloat(valStr) || 0;
    const curR = [...geometry.transform.rotation] as [number, number, number];
    curR[axis] = val;
    onUpdateTransform(geometry.geometryId, geometry.transform.translation, curR, geometry.transform.scale);
  };

  const handleScaleChange = (axis: 0 | 1 | 2, valStr: string) => {
    if (!onUpdateTransform) return;
    const val = parseFloat(valStr) || 1;
    const curS = [...geometry.transform.scale] as [number, number, number];
    curS[axis] = Math.max(0.01, val);
    onUpdateTransform(geometry.geometryId, geometry.transform.translation, geometry.transform.rotation, curS);
  };

  return (
    <aside
      style={{
        width: '320px',
        backgroundColor: '#090D16',
        borderLeft: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Inspector Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#A78BFA', letterSpacing: '0.04em' }}>
            INSPECTOR
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: colors.bg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              fontWeight: 700,
            }}
          >
            {geometry.identity.origin}
          </span>
        </div>

        <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
          {geometry.identity.name}
        </div>
        <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
          {geometry.geometryId}
        </div>
      </div>

      {/* Contextual Tabs */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #1E293B',
          padding: '2px',
        }}
      >
        {(['OBJECT', 'TRANSFORM', 'GEOMETRY', 'TOPOLOGY', 'REALITY', 'LINEAGE'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '5px 8px',
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: activeTab === tab ? '#7C3AED' : 'transparent',
              color: activeTab === tab ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.12s ease',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {/* TAB 1: OBJECT */}
        {activeTab === 'OBJECT' && (
          <div>
            <div style={sectionHeaderStyle}>Entity Identity</div>
            <div style={rowStyle}>
              <span style={labelStyle}>Geometry ID:</span>
              <span style={valueStyle}>{geometry.geometryId.slice(0, 16)}...</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Entity Type:</span>
              <span style={valueStyle}>{geometry.identity.geometryType}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Epistemic Origin:</span>
              <span style={{ ...valueStyle, color: colors.text }}>{geometry.identity.origin}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Certainty:</span>
              <span style={valueStyle}>{geometry.identity.certainty}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Sequence:</span>
              <span style={valueStyle}>#{geometry.identity.createdSequence}</span>
            </div>

            <div style={sectionHeaderStyle}>Container Binding</div>
            <div style={rowStyle}>
              <span style={labelStyle}>Workspace Obj:</span>
              <span style={valueStyle}>{geometry.workspaceObjectId || 'UNATTACHED'}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Lineage ID:</span>
              <span style={valueStyle}>{geometry.lineage.lineageId.slice(0, 16)}...</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Lineage Version:</span>
              <span style={valueStyle}>v{geometry.lineage.version}</span>
            </div>
          </div>
        )}

        {/* TAB 2: TRANSFORM */}
        {activeTab === 'TRANSFORM' && (
          <div>
            <div style={sectionHeaderStyle}>Translation (X, Y, Z)</div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ color: '#EF4444', fontWeight: 'bold', fontSize: '11px' }}>X</span>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.5"
                  value={geometry.transform.translation[0]}
                  onChange={(e) => handleCoordChange(0, e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ color: '#10B981', fontWeight: 'bold', fontSize: '11px' }}>Y</span>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.5"
                  value={geometry.transform.translation[1]}
                  onChange={(e) => handleCoordChange(1, e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: '11px' }}>Z</span>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.5"
                  value={geometry.transform.translation[2]}
                  onChange={(e) => handleCoordChange(2, e.target.value)}
                />
              </div>
            </div>

            <div style={sectionHeaderStyle}>Rotation Degrees (X, Y, Z)</div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ color: '#EF4444', fontWeight: 'bold', fontSize: '11px' }}>X</span>
                <input
                  style={inputStyle}
                  type="number"
                  step="15"
                  value={geometry.transform.rotation[0]}
                  onChange={(e) => handleRotChange(0, e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ color: '#10B981', fontWeight: 'bold', fontSize: '11px' }}>Y</span>
                <input
                  style={inputStyle}
                  type="number"
                  step="15"
                  value={geometry.transform.rotation[1]}
                  onChange={(e) => handleRotChange(1, e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: '11px' }}>Z</span>
                <input
                  style={inputStyle}
                  type="number"
                  step="15"
                  value={geometry.transform.rotation[2]}
                  onChange={(e) => handleRotChange(2, e.target.value)}
                />
              </div>
            </div>

            <div style={sectionHeaderStyle}>Scale Factor (X, Y, Z)</div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ color: '#EF4444', fontWeight: 'bold', fontSize: '11px' }}>X</span>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.1"
                  value={geometry.transform.scale[0]}
                  onChange={(e) => handleScaleChange(0, e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ color: '#10B981', fontWeight: 'bold', fontSize: '11px' }}>Y</span>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.1"
                  value={geometry.transform.scale[1]}
                  onChange={(e) => handleScaleChange(1, e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: '11px' }}>Z</span>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.1"
                  value={geometry.transform.scale[2]}
                  onChange={(e) => handleScaleChange(2, e.target.value)}
                />
              </div>
            </div>

            <div style={sectionHeaderStyle}>Transform Checksum</div>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {geometry.transform.transformChecksum}
            </div>
          </div>
        )}

        {/* TAB 3: GEOMETRY */}
        {activeTab === 'GEOMETRY' && (
          <div>
            <div style={sectionHeaderStyle}>Mesh Elements</div>
            <div style={rowStyle}>
              <span style={labelStyle}>Vertices:</span>
              <span style={valueStyle}>{geometry.mesh.vertices.length}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Edges:</span>
              <span style={valueStyle}>{geometry.mesh.edges.length}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Faces:</span>
              <span style={valueStyle}>{geometry.mesh.faces.length}</span>
            </div>

            <div style={sectionHeaderStyle}>Dimensions & Bounding Box</div>
            <div style={rowStyle}>
              <span style={labelStyle}>Width (X):</span>
              <span style={valueStyle}>{geometry.dimensions.width.toFixed(3)} m</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Height (Y):</span>
              <span style={valueStyle}>{geometry.dimensions.height.toFixed(3)} m</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Depth (Z):</span>
              <span style={valueStyle}>{geometry.dimensions.depth.toFixed(3)} m</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Centroid:</span>
              <span style={valueStyle}>[{geometry.mesh.boundingBox.center.map((c) => c.toFixed(2)).join(', ')}]</span>
            </div>

            <div style={sectionHeaderStyle}>Geometry Checksum</div>
            <div style={{ fontSize: '10px', color: '#A78BFA', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {geometry.geometryChecksum}
            </div>
          </div>
        )}

        {/* TAB 4: TOPOLOGY */}
        {activeTab === 'TOPOLOGY' && (
          <div>
            <div style={sectionHeaderStyle}>Topological Integrity</div>
            <div style={rowStyle}>
              <span style={labelStyle}>2-Manifold:</span>
              <span style={{ ...valueStyle, color: topology.isManifold ? '#34D399' : '#EF4444' }}>
                {topology.isManifold ? 'YES (Valid)' : 'NO (Non-Manifold)'}
              </span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Has Boundary:</span>
              <span style={valueStyle}>{topology.hasBoundary ? 'YES' : 'NO (Closed)'}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Connected Components:</span>
              <span style={valueStyle}>{topology.connectedComponents}</span>
            </div>

            <div style={sectionHeaderStyle}>Topology Checksum</div>
            <div style={{ fontSize: '10px', color: '#38BDF8', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {topology.topologyChecksum}
            </div>
          </div>
        )}

        {/* TAB 5: REALITY */}
        {activeTab === 'REALITY' && (
          <div>
            <div style={sectionHeaderStyle}>Authoritative Physical Reference</div>
            {geometry.realityReference ? (
              <>
                <div style={rowStyle}>
                  <span style={labelStyle}>Reality Obj ID:</span>
                  <span style={valueStyle}>{geometry.realityReference.realityObjectId}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Reality State ID:</span>
                  <span style={valueStyle}>{geometry.realityReference.realityStateId}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Canonical Coords:</span>
                  <span style={{ ...valueStyle, color: '#00FF88', fontWeight: 800 }}>
                    [{geometry.realityReference.realityCoordinates.join(', ')}]
                  </span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Certainty:</span>
                  <span style={valueStyle}>{geometry.realityReference.realityCertainty}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Origin:</span>
                  <span style={{ ...valueStyle, color: '#06B6D4' }}>{geometry.realityReference.realityOrigin}</span>
                </div>
                <div style={sectionHeaderStyle}>Reality Checksum</div>
                <div style={{ fontSize: '10px', color: '#00FF88', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {geometry.realityReference.realityChecksum}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '11px', color: '#F59E0B', fontStyle: 'italic', padding: '8px', backgroundColor: '#1E1B4B', borderRadius: '4px' }}>
                Purely Constructed Geometry (ΔReality = 0). No direct physical Reality reference attached.
              </div>
            )}
          </div>
        )}

        {/* TAB 6: LINEAGE */}
        {activeTab === 'LINEAGE' && (
          <div>
            <div style={sectionHeaderStyle}>Multi-Hop Epistemic Provenance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {lineageTrace.hops.map((hop, idx) => (
                <div
                  key={hop.hopIndex}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span style={{ fontWeight: 'bold', color: '#A78BFA' }}>#{idx + 1} {hop.entityType}</span>
                    <span>{hop.entityId.slice(0, 12)}...</span>
                  </div>
                  <div style={{ color: '#CBD5E1', marginTop: '2px', fontSize: '10px' }}>
                    {hop.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
