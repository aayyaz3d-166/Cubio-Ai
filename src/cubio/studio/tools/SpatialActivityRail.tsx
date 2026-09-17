/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 7: Spatial Activity & Progress Rail Component
 *
 * Compact vertical operation tracking rail displaying:
 * ● Processing
 * │
 * ● Inspecting geometry
 * │
 * ● Calculating dimensions
 * │
 * ○ Preparing result
 */

import React from 'react';
import { ActivityStep } from './types';

export interface SpatialActivityRailProps {
  readonly steps: readonly ActivityStep[];
  readonly isProcessing?: boolean;
}

export const SpatialActivityRail: React.FC<SpatialActivityRailProps> = ({
  steps,
  isProcessing = false,
}) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: '#070D1A',
        border: '1px solid #131E35',
        borderRadius: '10px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        userSelect: 'none',
        fontSize: '11.5px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 800,
          color: '#64748B',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '8px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        Spatial Pipeline Status
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isInProgress = step.status === 'in_progress';
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Status Dot */}
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted
                      ? '#10B981'
                      : isInProgress
                      ? '#38BDF8'
                      : 'transparent',
                    border: isCompleted
                      ? 'none'
                      : isInProgress
                      ? '2px solid #38BDF8'
                      : '1.5px solid #475569',
                    boxShadow: isInProgress ? '0 0 8px rgba(56, 189, 248, 0.6)' : 'none',
                    shrink: 0,
                  }}
                />

                <span
                  style={{
                    color: isCompleted ? '#F8FAFC' : isInProgress ? '#38BDF8' : '#64748B',
                    fontWeight: isCompleted || isInProgress ? 700 : 500,
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line between steps */}
              {!isLast && (
                <div
                  style={{
                    width: '1px',
                    height: '14px',
                    backgroundColor: isCompleted ? '#059669' : '#1E293B',
                    marginLeft: '3.5px',
                    marginTop: '2px',
                    marginBottom: '2px',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
