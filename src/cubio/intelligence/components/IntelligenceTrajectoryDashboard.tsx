import React from 'react';
import { GenerationMetadata } from '../continual_learning/types';

export interface IntelligenceTrajectoryDashboardProps {
  metadata?: GenerationMetadata;
}

export const IntelligenceTrajectoryDashboard: React.FC<IntelligenceTrajectoryDashboardProps> = ({
  metadata = {
    currentGeneration: 2,
    previousGeneration: 1,
    baselineCii: 74.6,
    currentCii: 82.3,
    experienceGainDeltaCii: 7.7,
    novelTaskGainPercent: 11.4,
    regressionRetentionPercent: 99.7,
    failedLessonsCount: 23,
    verifiedSkillsCount: 147,
    candidateSkillsCount: 31,
    rejectedCandidatesCount: 18,
    learningStatus: 'VERIFIED',
    generationMerkleRoot: '0x000F98E2A...',
  },
}) => {
  return (
    <div
      style={{
        backgroundColor: '#0a0d14',
        border: '1px solid #1f293d',
        borderRadius: '12px',
        padding: '24px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        maxWidth: '680px',
        margin: '16px auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f293d', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#38bdf8', letterSpacing: '1px' }}>
          👑 CUBIO CONTINUAL INTELLIGENCE
        </h2>
        <span
          style={{
            backgroundColor: '#064e3b',
            color: '#34d399',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          STATUS: {metadata.learningStatus}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', marginBottom: '20px' }}>
        <div>
          <span style={{ color: '#94a3b8' }}>Current Generation:</span>{' '}
          <strong style={{ color: '#f8fafc' }}>GEN {metadata.currentGeneration}</strong>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Baseline CII:</span>{' '}
          <span style={{ color: '#cbd5e1' }}>{metadata.baselineCii.toFixed(1)}</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Current CII:</span>{' '}
          <strong style={{ color: '#38bdf8' }}>{metadata.currentCii.toFixed(1)}</strong>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Experience Gain:</span>{' '}
          <strong style={{ color: '#4ade80' }}>+{metadata.experienceGainDeltaCii.toFixed(1)} ΔCII</strong>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Novel Task Gain:</span>{' '}
          <span style={{ color: '#a7f3d0' }}>+{metadata.novelTaskGainPercent.toFixed(1)}%</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Regression Retention:</span>{' '}
          <span style={{ color: '#38bdf8' }}>{metadata.regressionRetentionPercent.toFixed(1)}%</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Verified Skills:</span>{' '}
          <span style={{ color: '#e2e8f0' }}>{metadata.verifiedSkillsCount}</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Failed Lessons (RCA):</span>{' '}
          <span style={{ color: '#f87171' }}>{metadata.failedLessonsCount}</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Candidate Skills:</span>{' '}
          <span style={{ color: '#fde047' }}>{metadata.candidateSkillsCount}</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Rejected Candidates:</span>{' '}
          <span style={{ color: '#94a3b8' }}>{metadata.rejectedCandidatesCount}</span>
        </div>
      </div>

      <div style={{ backgroundColor: '#05070a', padding: '16px', borderRadius: '8px', border: '1px solid #111827' }}>
        <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>
          MEASURABLE CONTINUAL LEARNING TRAJECTORY
        </div>
        <pre style={{ margin: 0, color: '#38bdf8', fontSize: '13px', lineHeight: '1.4' }}>
{`CII
100 ┤                                  ╭──── Gen N (100)
 90 ┤                           ╭──────╯
 82 ┤                    ╭──────╯ (Current: Gen 2 - 82.3)
 74 ┤             ╭──────╯ (Baseline: Gen 1 - 74.6)
 60 ┤       ╭─────╯
 50 ┤───────╯
    └──────────────────────────────────────────────────
       Experience Buffer / Verified Generations`}
        </pre>
      </div>
    </div>
  );
};
