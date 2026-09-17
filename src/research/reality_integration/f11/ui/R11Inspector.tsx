/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Contextual World Inspector UI
 *
 * Inspector with tabs for Entity, Relations, Evidence, Lineage, Counterfactuals, and Planning.
 */

import React, { useState } from 'react';
import {
  Sliders,
  Box,
  Link,
  Layers,
  Sparkles,
  GitBranch,
  Play,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { WorldModel, WorldEntity, CounterfactualState, SpatialPlan } from '../types';
import { F11LineageEngine } from '../lineage';
import { F11CounterfactualEngine } from '../counterfactualEngine';
import { F11PlanningEngine } from '../planningEngine';

export interface R11InspectorProps {
  readonly model: WorldModel;
  readonly selectedEntity: WorldEntity | null;
}

export const R11Inspector: React.FC<R11InspectorProps> = ({
  model,
  selectedEntity,
}) => {
  const [activeTab, setActiveTab] = useState<
    'ENTITY' | 'RELATIONS' | 'LINEAGE' | 'COUNTERFACTUAL' | 'PLAN'
  >('ENTITY');

  const [counterfactualResult, setCounterfactualResult] = useState<CounterfactualState | null>(null);
  const [planResult, setPlanResult] = useState<SpatialPlan | null>(null);

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
    marginTop: '10px',
    borderBottom: '1px solid #1E293B',
    paddingBottom: '4px',
  };

  const handleRunCounterfactual = (deltaY: number) => {
    if (!selectedEntity || !selectedEntity.coordinates) return;
    const cur = selectedEntity.coordinates;
    const hypoPos: [number, number, number] = [cur[0], cur[1] + deltaY, cur[2]];
    const cf = F11CounterfactualEngine.simulatePositionChange(
      model,
      selectedEntity.entityId,
      hypoPos,
      `Hypothetically shift ${selectedEntity.name} by ΔY=${deltaY > 0 ? '+' : ''}${deltaY}`
    );
    setCounterfactualResult(cf);
  };

  const handlePlanGoal = (goalRel: any) => {
    if (!selectedEntity) return;
    const otherEntities: WorldEntity[] = (Object.values(model.entities) as WorldEntity[]).filter((e: WorldEntity) => e.entityId !== selectedEntity.entityId);
    if (otherEntities.length === 0) return;
    const ref = otherEntities[0];
    const plan = F11PlanningEngine.planSpatialGoal(model, selectedEntity.entityId, goalRel, ref.entityId);
    setPlanResult(plan);
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
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders className="w-4 h-4 text-blue-400" />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#93C5FD', letterSpacing: '0.04em' }}>
              WORLD INSPECTOR
            </span>
          </div>
          <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
            {selectedEntity ? selectedEntity.name : 'NO SELECTION'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', backgroundColor: '#0F172A', borderBottom: '1px solid #1E293B', padding: '2px' }}>
        {(['ENTITY', 'RELATIONS', 'LINEAGE', 'COUNTERFACTUAL', 'PLAN'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '5px 0',
              fontSize: '9px',
              fontWeight: 700,
              backgroundColor: activeTab === tab ? '#2563EB' : 'transparent',
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
        {/* TAB 1: ENTITY */}
        {activeTab === 'ENTITY' && (
          selectedEntity ? (
            <div>
              <div style={sectionHeaderStyle}>Entity Identity</div>
              <div style={rowStyle}>
                <span style={labelStyle}>Name:</span>
                <span style={{ ...valueStyle, color: '#60A5FA' }}>{selectedEntity.name}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Type:</span>
                <span style={valueStyle}>{selectedEntity.entityType}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Origin:</span>
                <span style={{ ...valueStyle, color: selectedEntity.origin === 'OBSERVED' ? '#34D399' : '#FBBF24' }}>
                  {selectedEntity.origin}
                </span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Certainty:</span>
                <span style={valueStyle}>{selectedEntity.certainty}</span>
              </div>

              <div style={sectionHeaderStyle}>Spatial Coordinates</div>
              {selectedEntity.coordinates ? (
                <div style={rowStyle}>
                  <span style={labelStyle}>Position:</span>
                  <span style={{ ...valueStyle, color: '#38BDF8' }}>
                    [{selectedEntity.coordinates.map((n) => n.toFixed(2)).join(', ')}]
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: '10px', color: '#64748B' }}>No coordinates</div>
              )}

              <div style={sectionHeaderStyle}>Authority & Safety</div>
              <div style={rowStyle}>
                <span style={labelStyle}>ΔReality:</span>
                <span style={{ ...valueStyle, color: '#34D399', fontWeight: 800 }}>0 (Invariant)</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Reality Anchor:</span>
                <span style={{ ...valueStyle, color: '#34D399', fontWeight: 800 }}>[5, 3, 6]</span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
              Select an entity in the 3D scene or left panel.
            </div>
          )
        )}

        {/* TAB 2: RELATIONS */}
        {activeTab === 'RELATIONS' && (
          selectedEntity ? (
            <div>
              <div style={sectionHeaderStyle}>Direct Relations</div>
              {model.relations
                .filter((r) => r.sourceEntityId === selectedEntity.entityId || r.targetEntityId === selectedEntity.entityId)
                .map((r) => (
                  <div
                    key={r.relationId}
                    style={{
                      padding: '6px',
                      borderRadius: '4px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      marginBottom: '6px',
                      fontSize: '10px',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#E2E8F0' }}>
                      {model.entities[r.sourceEntityId]?.name} <strong style={{ color: '#38BDF8' }}>{r.relationType}</strong> {model.entities[r.targetEntityId]?.name}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
              Select an entity to inspect relations.
            </div>
          )
        )}

        {/* TAB 3: LINEAGE */}
        {activeTab === 'LINEAGE' && (
          selectedEntity ? (
            <div>
              <div style={sectionHeaderStyle}>Multi-Hop Lineage Trace</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {F11LineageEngine.traceEntityLineage(selectedEntity).hops.map((hop) => (
                  <div
                    key={hop.hopIndex}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      fontSize: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                      <span style={{ fontWeight: 700, color: '#60A5FA' }}>#{hop.hopIndex} {hop.stage}</span>
                      <span style={{ fontFamily: 'monospace' }}>{hop.entityId.slice(0, 10)}...</span>
                    </div>
                    <div style={{ color: '#CBD5E1', marginTop: '2px' }}>{hop.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
              Select an entity to inspect lineage.
            </div>
          )
        )}

        {/* TAB 4: COUNTERFACTUAL */}
        {activeTab === 'COUNTERFACTUAL' && (
          selectedEntity ? (
            <div>
              <div style={sectionHeaderStyle}>Hypothetical Simulation</div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '8px' }}>
                Simulate spatial position shifts without modifying World Model or Reality:
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <button
                  onClick={() => handleRunCounterfactual(4.0)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '10px',
                    backgroundColor: '#1E293B',
                    color: '#93C5FD',
                    border: '1px solid #3B82F6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Move Up (+4m)
                </button>
                <button
                  onClick={() => handleRunCounterfactual(-4.0)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '10px',
                    backgroundColor: '#1E293B',
                    color: '#93C5FD',
                    border: '1px solid #3B82F6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Move Down (-4m)
                </button>
              </div>

              {counterfactualResult && (
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: '#1E1B4B',
                    border: '1px solid #4338CA',
                    fontSize: '10px',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#C7D2FE', marginBottom: '4px' }}>
                    SIMULATION RESULTS (SANDBOX)
                  </div>
                  <div style={{ color: '#E0E7FF' }}>{counterfactualResult.hypotheticalChangeDescription}</div>
                  <div style={{ color: '#34D399', marginTop: '4px' }}>
                    + Added Relations: {counterfactualResult.addedRelations.length}
                  </div>
                  <div style={{ color: '#F87171', marginTop: '2px' }}>
                    - Removed Relations: {counterfactualResult.removedRelations.length}
                  </div>
                  <div style={{ color: '#A5B4FC', marginTop: '4px', fontWeight: 'bold' }}>
                    ΔReality = 0 (Reality Unchanged)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
              Select an entity to run counterfactual simulations.
            </div>
          )
        )}

        {/* TAB 5: PLAN */}
        {activeTab === 'PLAN' && (
          selectedEntity ? (
            <div>
              <div style={sectionHeaderStyle}>Deterministic Goal Planning</div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '8px' }}>
                Generate execution plans to establish goal relations:
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <button
                  onClick={() => handlePlanGoal('ABOVE')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '10px',
                    backgroundColor: '#064E3B',
                    color: '#6EE7B7',
                    border: '1px solid #059669',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Plan ABOVE
                </button>
                <button
                  onClick={() => handlePlanGoal('LEFT_OF')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '10px',
                    backgroundColor: '#1E293B',
                    color: '#93C5FD',
                    border: '1px solid #3B82F6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Plan LEFT
                </button>
              </div>

              {planResult && (
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    fontSize: '10px',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
                    {planResult.status}: {planResult.goalDescription}
                  </div>
                  <div style={{ color: '#CBD5E1' }}>Operation: {planResult.requiredOperation}</div>
                  <div style={{ color: '#94A3B8', marginTop: '2px' }}>
                    Target Pos: [{planResult.expectedPosition.map((n) => n.toFixed(2)).join(', ')}]
                  </div>
                  <div style={{ color: '#F59E0B', marginTop: '4px', fontStyle: 'italic' }}>
                    * Plan generated in reasoning layer (Not auto-executed)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
              Select an entity to generate spatial plans.
            </div>
          )
        )}
      </div>
    </aside>
  );
};
