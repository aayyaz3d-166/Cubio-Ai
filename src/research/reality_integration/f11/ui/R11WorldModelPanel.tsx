/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: World Model Left Panel UI
 *
 * Displays World Entities, Direct Relationships, Multi-Hop Inferences, and Constraints
 * with live search and filtering.
 */

import React, { useState } from 'react';
import {
  Globe,
  Box,
  Layers,
  Link,
  Zap,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertCircle,
  Network,
} from 'lucide-react';
import { WorldModel, WorldEntity, WorldRelation, Inference } from '../types';

export interface R11WorldModelPanelProps {
  readonly model: WorldModel;
  readonly selectedEntityId: string | null;
  readonly onSelectEntity: (entityId: string) => void;
}

export const R11WorldModelPanel: React.FC<R11WorldModelPanelProps> = ({
  model,
  selectedEntityId,
  onSelectEntity,
}) => {
  const [activeTab, setActiveTab] = useState<'ENTITIES' | 'RELATIONS' | 'INFERENCES' | 'CONSTRAINTS'>('ENTITIES');
  const [filterText, setFilterText] = useState('');

  const entities: readonly WorldEntity[] = Object.values(model.entities);
  const relations = model.relations;
  const inferences = model.inferences;
  const constraints = model.constraints;

  const filteredEntities = entities.filter((e) =>
    e.name.toLowerCase().includes(filterText.toLowerCase()) ||
    e.entityType.toLowerCase().includes(filterText.toLowerCase()) ||
    e.origin.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredRelations = relations.filter((r) =>
    r.relationType.toLowerCase().includes(filterText.toLowerCase()) ||
    (model.entities[r.sourceEntityId]?.name || '').toLowerCase().includes(filterText.toLowerCase()) ||
    (model.entities[r.targetEntityId]?.name || '').toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredInferences = inferences.filter((i) =>
    i.ruleId.toLowerCase().includes(filterText.toLowerCase()) ||
    i.derivedRelation.relationType.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <aside
      style={{
        width: '320px',
        backgroundColor: '#070B14',
        borderRight: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Panel Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B', backgroundColor: '#090D16' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe className="w-4 h-4 text-blue-400" />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#93C5FD', letterSpacing: '0.04em' }}>
              WORLD MODEL
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: '#1E3A8A',
              color: '#BFDBFE',
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            v{model.version}
          </span>
        </div>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '4px 8px',
          }}
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter entities, relations, rules..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F8FAFC',
              fontSize: '11px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', backgroundColor: '#0F172A', borderBottom: '1px solid #1E293B', padding: '2px' }}>
        {(['ENTITIES', 'RELATIONS', 'INFERENCES', 'CONSTRAINTS'] as const).map((tab) => {
          const count =
            tab === 'ENTITIES'
              ? entities.length
              : tab === 'RELATIONS'
              ? relations.length
              : tab === 'INFERENCES'
              ? inferences.length
              : constraints.length;

          return (
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
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* List Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* TAB 1: ENTITIES */}
        {activeTab === 'ENTITIES' && (
          filteredEntities.length === 0 ? (
            <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic', padding: '10px' }}>
              No entities found.
            </div>
          ) : (
            filteredEntities.map((ent) => {
              const isSelected = ent.entityId === selectedEntityId;
              const isObserved = ent.origin === 'OBSERVED';
              const coords = ent.coordinates || ent.transform?.translation;

              return (
                <div
                  key={ent.entityId}
                  onClick={() => onSelectEntity(ent.entityId)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? '#1E3A8A' : '#0F172A',
                    border: '1px solid ' + (isSelected ? '#3B82F6' : isObserved ? '#059669' : '#1E293B'),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Box className="w-3.5 h-3.5 text-blue-400" />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#F8FAFC' }}>
                        {ent.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: isObserved ? '#064E3B' : '#312E81',
                        color: isObserved ? '#34D399' : '#C7D2FE',
                        fontWeight: 700,
                      }}
                    >
                      {ent.origin}
                    </span>
                  </div>

                  {coords && (
                    <div style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'monospace', marginTop: '4px' }}>
                      Position: [{coords.map((n) => n.toFixed(1)).join(', ')}]
                    </div>
                  )}
                </div>
              );
            })
          )
        )}

        {/* TAB 2: RELATIONS */}
        {activeTab === 'RELATIONS' && (
          filteredRelations.length === 0 ? (
            <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic', padding: '10px' }}>
              No relationships derived.
            </div>
          ) : (
            filteredRelations.map((rel) => {
              const srcName = model.entities[rel.sourceEntityId]?.name || rel.sourceEntityId;
              const tgtName = model.entities[rel.targetEntityId]?.name || rel.targetEntityId;

              return (
                <div
                  key={rel.relationId}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '5px',
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#CBD5E1' }}>
                      {srcName} <strong style={{ color: '#60A5FA' }}>{rel.relationType}</strong> {tgtName}
                    </span>
                    <span style={{ fontSize: '9px', color: '#34D399', fontWeight: 'bold' }}>
                      DIRECT
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748B', marginTop: '2px', fontFamily: 'monospace' }}>
                    Method: {rel.evidence.method}
                  </div>
                </div>
              );
            })
          )
        )}

        {/* TAB 3: INFERENCES */}
        {activeTab === 'INFERENCES' && (
          filteredInferences.length === 0 ? (
            <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic', padding: '10px' }}>
              No multi-hop inferences active.
            </div>
          ) : (
            filteredInferences.map((inf) => {
              const src = model.entities[inf.derivedRelation.sourceEntityId]?.name || inf.derivedRelation.sourceEntityId;
              const tgt = model.entities[inf.derivedRelation.targetEntityId]?.name || inf.derivedRelation.targetEntityId;

              return (
                <div
                  key={inf.inferenceId}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: '#1E1B4B',
                    border: '1px solid #4338CA',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#E0E7FF' }}>
                      {src} <strong style={{ color: '#A78BFA' }}>{inf.derivedRelation.relationType}</strong> {tgt}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        backgroundColor: '#3730A3',
                        color: '#C7D2FE',
                        fontWeight: 700,
                      }}
                    >
                      INFERRED
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#A5B4FC', marginTop: '3px', fontFamily: 'monospace' }}>
                    Rule: {inf.ruleId} (conf: {(inf.confidence * 100).toFixed(0)}%)
                  </div>
                </div>
              );
            })
          )
        )}

        {/* TAB 4: CONSTRAINTS */}
        {activeTab === 'CONSTRAINTS' && (
          constraints.length === 0 ? (
            <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic', padding: '10px' }}>
              No spatial constraints configured.
            </div>
          ) : (
            constraints.map((c) => (
              <div
                key={c.constraintId}
                style={{
                  padding: '8px',
                  borderRadius: '5px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  fontSize: '11px',
                }}
              >
                <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{c.description}</div>
              </div>
            ))
          )
        )}
      </div>
    </aside>
  );
};
