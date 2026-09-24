/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F70: Universal Project Panel Component
 */

import React from 'react';

interface UniversalProjectPanelProps {
  healthScore: number;
  progressPercent: number;
}

export const UniversalProjectPanel: React.FC<UniversalProjectPanelProps> = ({
  healthScore,
  progressPercent,
}) => {
  return (
    <div style={{ padding: '24px', background: '#0d0d18', color: '#e0e0e8', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ color: '#ffd700', fontSize: '20px', marginBottom: '8px' }}>📊 Project Intelligence 2.0 Dashboard</h2>
      <p style={{ color: '#8888aa', fontSize: '13px', marginBottom: '24px' }}>
        Holistic tracking across files, architecture layers, goals, tasks, and immutable ADR decision logs.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#141424', padding: '20px', borderRadius: '10px', border: '1px solid #22223c' }}>
          <div style={{ color: '#888', fontSize: '12px' }}>PROJECT HEALTH SCORE</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{healthScore} / 100</div>
        </div>

        <div style={{ background: '#141424', padding: '20px', borderRadius: '10px', border: '1px solid #22223c' }}>
          <div style={{ color: '#888', fontSize: '12px' }}>OVERALL PROGRESS</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ffd700', marginTop: '4px' }}>{progressPercent}%</div>
        </div>
      </div>
    </div>
  );
};
