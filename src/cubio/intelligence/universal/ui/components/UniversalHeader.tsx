/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F70: Universal UI Header Component
 */

import React from 'react';
import { UniversalUITab } from '../types';

interface UniversalHeaderProps {
  activeTab: UniversalUITab;
  onSelectTab: (tab: UniversalUITab) => void;
  currentDimension: string;
  healthScore: number;
}

export const UniversalHeader: React.FC<UniversalHeaderProps> = ({
  activeTab,
  onSelectTab,
  currentDimension,
  healthScore,
}) => {
  const tabs: { id: UniversalUITab; label: string; icon: string }[] = [
    { id: 'CHAT', label: 'Omni Chat', icon: '💬' },
    { id: 'IMAGE', label: 'Vision / Image', icon: '🖼️' },
    { id: 'VOICE', label: 'Voice / Audio', icon: '🎙️' },
    { id: 'FILES', label: 'Files', icon: '📁' },
    { id: 'CODE', label: 'Code Sandbox', icon: '💻' },
    { id: 'PROJECT', label: 'Project 2.0', icon: '📊' },
    { id: 'WORKFLOW', label: '10-Stage Workflow', icon: '⚡' },
    { id: 'AGENTS', label: 'Multi-Agent', icon: '🤖' },
    { id: 'ARTIFACTS', label: '3D Artifacts', icon: '💎' },
  ];

  return (
    <header className="cubio-universal-header" style={{ background: '#0a0a12', borderBottom: '1px solid #222238', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontSize: '20px', fontWeight: 800, background: 'linear-gradient(135deg, #ffd700, #ffb300)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          CubiO Super Intelligence
        </div>
        <span style={{ fontSize: '11px', background: '#1a1a2e', border: '1px solid #ffd70044', color: '#ffd700', padding: '2px 8px', borderRadius: '12px' }}>
          {currentDimension} State
        </span>
        <span style={{ fontSize: '11px', background: '#0f2b1d', border: '1px solid #10b98144', color: '#10b981', padding: '2px 8px', borderRadius: '12px' }}>
          Health: {healthScore}%
        </span>
      </div>

      <nav style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            style={{
              background: activeTab === tab.id ? '#1e1e38' : 'transparent',
              color: activeTab === tab.id ? '#ffd700' : '#8888aa',
              border: activeTab === tab.id ? '1px solid #ffd70066' : '1px solid transparent',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
};
