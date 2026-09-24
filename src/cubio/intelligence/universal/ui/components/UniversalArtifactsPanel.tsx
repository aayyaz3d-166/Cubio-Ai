/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F70: Universal Artifacts Panel Component
 */

import React from 'react';

interface UniversalArtifactsPanelProps {
  artifacts: readonly { name: string; type: string; uri?: string }[];
}

export const UniversalArtifactsPanel: React.FC<UniversalArtifactsPanelProps> = ({ artifacts }) => {
  return (
    <div style={{ padding: '24px', background: '#0d0d18', color: '#e0e0e8', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ color: '#ffd700', fontSize: '20px', marginBottom: '8px' }}>💎 3D Spatial Artifacts & Assets Viewport</h2>
      <p style={{ color: '#8888aa', fontSize: '13px', marginBottom: '24px' }}>
        Procedurally synthesized 3D meshes, closed 2-manifolds, and production deployment bundles.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {artifacts.length === 0 && (
          <div style={{ color: '#666', gridColumn: '1 / -1' }}>No artifacts generated yet. Run a workflow to synthesize assets.</div>
        )}

        {artifacts.map((art) => (
          <div key={art.name} style={{ background: '#141424', border: '1px solid #ffd70044', padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{art.type === '3D_ASSET' ? '💎' : '📄'}</div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>{art.name}</div>
            <div style={{ color: '#00e5ff', fontSize: '11px', marginTop: '4px' }}>{art.type}</div>
            {art.uri && <div style={{ color: '#888', fontSize: '11px', marginTop: '4px', wordBreak: 'break-all' }}>{art.uri}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};
