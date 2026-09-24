/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F70: Universal Workflow & Project Panels
 */

import React from 'react';

interface UniversalWorkflowPanelProps {
  workflowStages: readonly { stage: string; status: string }[];
  isAwaitingAuth: boolean;
  onAuthorize: () => void;
  stagingUrl?: string;
}

export const UniversalWorkflowPanel: React.FC<UniversalWorkflowPanelProps> = ({
  workflowStages,
  isAwaitingAuth,
  onAuthorize,
  stagingUrl,
}) => {
  const defaultStages = [
    'UNDERSTAND',
    'PLAN',
    'DESIGN',
    'GENERATE_CODE',
    'GENERATE_ASSETS',
    'RUN_TESTS',
    'FIX_ERRORS',
    'BUILD',
    'DEPLOY_PROPOSAL',
    'ASK_AUTHORIZATION',
  ];

  return (
    <div style={{ padding: '24px', background: '#0d0d18', color: '#e0e0e8', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ color: '#ffd700', fontSize: '20px', marginBottom: '8px' }}>⚡ 10-Stage Autonomous Workflow Pipeline</h2>
      <p style={{ color: '#8888aa', fontSize: '13px', marginBottom: '24px' }}>
        End-to-end software synthesis with self-healing compiler diagnostics and sovereign human authorization gates.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {defaultStages.map((stage, idx) => {
          const match = workflowStages.find((s) => s.stage === stage);
          const status = match?.status || (idx === 0 ? 'COMPLETED' : 'PENDING');
          const isDone = status === 'COMPLETED';

          return (
            <div
              key={stage}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: '#141424',
                border: isDone ? '1px solid #10b98166' : '1px solid #222238',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: isDone ? '#10b981' : '#666688', fontWeight: 700 }}>
                  {idx + 1}.
                </span>
                <span style={{ fontWeight: 600, color: isDone ? '#fff' : '#aaa' }}>{stage}</span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: isDone ? '#0f2b1d' : '#1c1c2e',
                  color: isDone ? '#10b981' : '#888',
                }}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>

      {stagingUrl && (
        <div style={{ background: '#141428', border: '1px solid #00e5ff44', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ color: '#00e5ff', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>🌐 STAGING PREVIEW AVAILABLE</div>
          <a href={stagingUrl} target="_blank" rel="noreferrer" style={{ color: '#fff', fontSize: '13px', textDecoration: 'underline' }}>
            {stagingUrl}
          </a>
        </div>
      )}

      {isAwaitingAuth && (
        <div style={{ background: '#261a00', border: '1px solid #ffd700', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#ffd700', fontWeight: 700, fontSize: '15px' }}>🔒 Human Authorization Gate Triggered</div>
            <div style={{ color: '#ccc', fontSize: '12px', marginTop: '4px' }}>Release to production edge requires your sovereign sign-off.</div>
          </div>
          <button
            onClick={onAuthorize}
            style={{
              background: 'linear-gradient(135deg, #ffd700, #ffb300)',
              color: '#000',
              fontWeight: 800,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Authorize Release ✅
          </button>
        </div>
      )}
    </div>
  );
};
