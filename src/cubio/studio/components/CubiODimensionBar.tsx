/**
 * CubiO — Universal Spatial Operating Environment
 * Exact Reference Bottom Realtime Telemetry & Message Console
 */

import React from 'react';
import { Sparkles, Activity } from 'lucide-react';
import { CubiODimension, CubiOState } from '../../types';

export interface CubiODimensionBarProps {
  readonly activeDimension: CubiODimension;
  readonly onSelectDimension: (dim: CubiODimension) => void;
  readonly activeState: (CubiOState | any) | null;
  readonly latestLogMessage?: string;
}

export const CubiODimensionBar: React.FC<CubiODimensionBarProps> = ({
  activeDimension,
  onSelectDimension,
  activeState,
  latestLogMessage,
}) => {
  // Sparkline generator for Realtime Activity
  const renderActivityWave = () => (
    <svg width="110" height="24" viewBox="0 0 110 24" fill="none">
      <path
        d="M2 14 Q 15 2 28 14 T 54 14 T 80 8 T 108 16"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M2 18 Q 15 8 28 18 T 54 18 T 80 12 T 108 20"
        stroke="rgba(245, 158, 11, 0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );

  const metrics = [
    { label: 'STATES / SEC', value: '2,458', trend: '+12.5%' },
    { label: 'TRANSITIONS / SEC', value: '8,912', trend: '+8.1%' },
    { label: 'MEMORY RECORDS', value: '24.6K', trend: '+6.3%' },
    { label: 'PATTERNS DETECTED', value: '86', trend: '+9.2%' },
    { label: 'LEARNING EVENTS', value: '37', trend: '+7.4%' },
    { label: 'FEEDBACK LOOPS', value: '128', trend: '+10.6%' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '12px',
        padding: '0 12px 10px 12px',
        userSelect: 'none',
        height: '92px',
        shrink: 0,
      }}
    >
      {/* 1. LEFT CARD: REALTIME ACTIVITY */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#070D1A',
          borderRadius: '12px',
          border: '1px solid #131E35',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Live Sparkline Indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '16px', shrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.04em' }}>
              REALTIME ACTIVITY
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '9.5px', color: '#10B981', fontFamily: 'monospace', fontWeight: 700 }}>
              Live
            </span>
          </div>
          <div style={{ marginTop: '2px' }}>{renderActivityWave()}</div>
        </div>

        {/* 6 Metrics Grid */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flex: 1, gap: '16px' }}>
          {metrics.map((m) => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.05em',
                  fontFamily: 'monospace',
                }}
              >
                {m.label}
              </span>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: '#F8FAFC',
                  fontFamily: 'monospace',
                  marginTop: '2px',
                }}
              >
                {m.value}
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: '#10B981',
                  fontFamily: 'monospace',
                }}
              >
                {m.trend}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. RIGHT CARD: CUBiO MESSAGE CONSOLE */}
      <div
        style={{
          width: '320px',
          backgroundColor: '#070D1A',
          borderRadius: '12px',
          border: '1px solid #131E35',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          shrink: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '210px' }}>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#F8FAFC',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            CUBiO MESSAGE CONSOLE
          </span>
          <span style={{ fontSize: '10px', color: '#94A3B8', lineHeight: 1.25 }}>
            CubiO is observing, understanding and evolving...
          </span>
          <span style={{ fontSize: '9.5px', color: '#D97706', fontStyle: 'italic', fontWeight: 600 }}>
            Beyond the noise. Beyond the known.
          </span>
        </div>

        {/* Golden Particle Mesh Cloud SVG */}
        <div style={{ width: '60px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="56" height="38" viewBox="0 0 56 38" fill="none">
            <circle cx="10" cy="18" r="2.5" fill="#F59E0B" opacity="0.9" />
            <circle cx="22" cy="10" r="3" fill="#FDE68A" opacity="0.9" />
            <circle cx="28" cy="24" r="2" fill="#D97706" opacity="0.8" />
            <circle cx="38" cy="14" r="3.5" fill="#F59E0B" opacity="0.9" />
            <circle cx="48" cy="22" r="2" fill="#FDE68A" opacity="0.7" />
            <line x1="10" y1="18" x2="22" y2="10" stroke="#D97706" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="22" y1="10" x2="28" y2="24" stroke="#D97706" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="22" y1="10" x2="38" y2="14" stroke="#F59E0B" strokeWidth="0.8" />
            <line x1="28" y1="24" x2="38" y2="14" stroke="#D97706" strokeWidth="0.8" />
            <line x1="38" y1="14" x2="48" y2="22" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="2 2" />
          </svg>
        </div>
      </div>
    </div>
  );
};
