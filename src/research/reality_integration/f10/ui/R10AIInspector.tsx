/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Right Contextual AI Inspector UI
 *
 * Displays active intent, target resolutions, parameter breakdown,
 * epistemic domain, validation status, and multi-hop conversational lineage.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Network,
  Share2,
  FileCode,
  Sliders,
} from 'lucide-react';
import { SpatialCommandPlan } from '../types';
import { WorkspaceGeometry } from '../../r9/types';
import { F10LineageEngine } from '../lineage';

export interface R10AIInspectorProps {
  readonly activePlan: SpatialCommandPlan | null;
  readonly selectedGeometry: WorkspaceGeometry | null;
}

export const R10AIInspector: React.FC<R10AIInspectorProps> = ({
  activePlan,
  selectedGeometry,
}) => {
  const [activeTab, setActiveTab] = useState<'INTENT' | 'PLAN' | 'LINEAGE'>('INTENT');

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#A78BFA', letterSpacing: '0.04em' }}>
              AI INSPECTOR
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#064E3B',
              color: '#34D399',
              fontWeight: 'bold',
            }}
          >
            {activePlan ? activePlan.status : 'IDLE'}
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
          Spatial Intelligence & Provenance Inspector
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', backgroundColor: '#0F172A', borderBottom: '1px solid #1E293B', padding: '2px' }}>
        {(['INTENT', 'PLAN', 'LINEAGE'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '5px 0',
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: activeTab === tab ? '#7C3AED' : 'transparent',
              color: activeTab === tab ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {/* TAB 1: INTENT */}
        {activeTab === 'INTENT' && (
          <div>
            <div style={sectionHeaderStyle}>Extracted Intent</div>
            <div style={rowStyle}>
              <span style={labelStyle}>Intent Type:</span>
              <span style={{ ...valueStyle, color: '#A78BFA' }}>{activePlan ? activePlan.intent : 'IDLE'}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Source Text:</span>
              <span style={{ ...valueStyle, fontSize: '10px' }}>
                {activePlan ? `"${activePlan.sourceText}"` : 'No active command'}
              </span>
            </div>

            <div style={sectionHeaderStyle}>Epistemic Authority Boundary</div>
            <div style={rowStyle}>
              <span style={labelStyle}>AI Domain:</span>
              <span style={{ ...valueStyle, color: '#F59E0B' }}>WORKSPACE</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Reality Mutation:</span>
              <span style={{ ...valueStyle, color: '#00FF88', fontWeight: 800 }}>0 (Invariant)</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Canonical Anchor:</span>
              <span style={{ ...valueStyle, color: '#00FF88', fontWeight: 800 }}>[5, 3, 6]</span>
            </div>

            <div style={sectionHeaderStyle}>Selected Geometry Context</div>
            {selectedGeometry ? (
              <>
                <div style={rowStyle}>
                  <span style={labelStyle}>Selected Geo:</span>
                  <span style={valueStyle}>{selectedGeometry.identity.name}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Origin:</span>
                  <span style={{ ...valueStyle, color: '#F59E0B' }}>{selectedGeometry.identity.origin}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Position:</span>
                  <span style={valueStyle}>
                    [{selectedGeometry.transform.translation.map((n) => n.toFixed(1)).join(', ')}]
                  </span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
                No geometry selected in workspace.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PLAN */}
        {activeTab === 'PLAN' && (
          <div>
            <div style={sectionHeaderStyle}>Spatial Plan Operations</div>
            {activePlan && activePlan.operations.length > 0 ? (
              activePlan.operations.map((op) => (
                <div
                  key={op.stepIndex}
                  style={{
                    padding: '8px',
                    borderRadius: '5px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    marginBottom: '8px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1', fontWeight: 'bold' }}>
                    <span style={{ color: '#A78BFA' }}>Step {op.stepIndex}: {op.operationType}</span>
                    <span style={{ color: '#38BDF8' }}>{op.domain}</span>
                  </div>
                  <div style={{ color: '#94A3B8', marginTop: '4px', fontSize: '10px' }}>
                    {op.description}
                  </div>
                  <div style={{ color: '#64748B', marginTop: '4px', fontSize: '9px', fontFamily: 'monospace' }}>
                    Params: {JSON.stringify(op.parameters)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
                No active spatial plan prepared.
              </div>
            )}

            {activePlan && (
              <>
                <div style={sectionHeaderStyle}>Plan Checksum</div>
                <div style={{ fontSize: '10px', color: '#A78BFA', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {activePlan.planChecksum}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: LINEAGE */}
        {activeTab === 'LINEAGE' && (
          <div>
            <div style={sectionHeaderStyle}>Multi-Hop Conversational Lineage</div>
            {activePlan ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {F10LineageEngine.traceLineage(activePlan.commandId, activePlan, selectedGeometry?.geometryId || null).hops.map((hop) => (
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
                      <span style={{ fontWeight: 'bold', color: '#A78BFA' }}>#{hop.hopIndex} {hop.stage}</span>
                      <span>{hop.entityId.slice(0, 10)}...</span>
                    </div>
                    <div style={{ color: '#CBD5E1', marginTop: '2px', fontSize: '10px' }}>
                      {hop.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
                Type a command to inspect conversational lineage.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
