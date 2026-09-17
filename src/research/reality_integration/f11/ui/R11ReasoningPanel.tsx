/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Reasoning & Explanation Panel UI
 *
 * Displays formal Query Answers, Evidence, Multi-Hop Reasoning Paths, and Rules Used.
 * Invariant: Explicitly reports ΔReality = 0.
 */

import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  Link,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SpatialQueryResult, WorldModel } from '../types';

export interface R11ReasoningPanelProps {
  readonly lastQueryResult: SpatialQueryResult | null;
  readonly model: WorldModel;
}

export const R11ReasoningPanel: React.FC<R11ReasoningPanelProps> = ({
  lastQueryResult,
  model,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#070B14',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: '#090D16',
          borderBottom: '1px solid #1E293B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap className="w-4 h-4 text-amber-400" />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#FDE68A', letterSpacing: '0.04em' }}>
            SPATIAL REASONING & EVIDENCE
          </span>
        </div>
        <span
          style={{
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: '#064E3B',
            color: '#34D399',
            fontWeight: 'bold',
          }}
        >
          ΔREALITY = 0
        </span>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {lastQueryResult ? (
          <>
            {/* Answer Card */}
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#1E293B',
                border: '1px solid #3B82F6',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#93C5FD', marginBottom: '4px' }}>
                ANSWER
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC', lineHeight: '1.4' }}>
                {lastQueryResult.explanation}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <span
                  style={{
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: lastQueryResult.status === 'SUCCESS' ? '#064E3B' : '#7F1D1D',
                    color: lastQueryResult.status === 'SUCCESS' ? '#34D399' : '#FCA5A5',
                    fontWeight: 700,
                  }}
                >
                  STATUS: {lastQueryResult.status}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#1E1B4B',
                    color: '#C7D2FE',
                    fontWeight: 700,
                  }}
                >
                  CONFIDENCE: {Math.round(lastQueryResult.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Evidence Card */}
            {lastQueryResult.evidence && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#34D399', marginBottom: '4px' }}>
                  EVIDENCE CLASSIFICATION
                </div>
                <div style={{ fontSize: '11px', color: '#E2E8F0', fontWeight: 600 }}>
                  {lastQueryResult.evidence.evidenceType}
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px' }}>
                  Method: {lastQueryResult.evidence.method}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px', fontFamily: 'monospace' }}>
                  {lastQueryResult.evidence.description}
                </div>
              </div>
            )}

            {/* Reasoning Trace Steps */}
            {lastQueryResult.reasoningTrace && lastQueryResult.reasoningTrace.steps.length > 0 && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#A78BFA', marginBottom: '6px' }}>
                  REASONING TRACE STEPS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {lastQueryResult.reasoningTrace.steps.map((step) => (
                    <div
                      key={step.stepIndex}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#1E1B4B',
                        border: '1px solid #4338CA',
                        fontSize: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#A5B4FC' }}>
                        <span style={{ fontWeight: 700 }}>Step {step.stepIndex}: {step.ruleUsed}</span>
                      </div>
                      <div style={{ color: '#F1F5F9', marginTop: '2px' }}>
                        {step.premiseDescription}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              padding: '24px 14px',
              textAlign: 'center',
              color: '#64748B',
              fontSize: '11px',
              fontStyle: 'italic',
            }}
          >
            Enter a spatial query above or select an object to view formal reasoning, multi-hop derivations, and evidence.
          </div>
        )}
      </div>
    </div>
  );
};
