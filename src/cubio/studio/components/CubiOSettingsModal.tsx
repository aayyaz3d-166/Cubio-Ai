/**
 * CubiO — Universal Spatial Operating Environment
 * Settings Modal Component
 */

import React from 'react';
import { X, Sliders, Monitor, Radio, ShieldCheck, Sparkles } from 'lucide-react';
import { CubiOSettings } from '../../types';

export interface CubiOSettingsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly settings: CubiOSettings;
  readonly onUpdateSettings: (newSettings: Partial<CubiOSettings>) => void;
}

export const CubiOSettingsModal: React.FC<CubiOSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        userSelect: 'none',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '540px',
          backgroundColor: '#070B16',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #1E293B',
            backgroundColor: '#090E1E',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC' }}>
              CUBiO OPERATING ENVIRONMENT SETTINGS
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Setting 1: Theme */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#F8FAFC' }}>Visual Theme</div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>Interface color and glow profile</div>
            </div>
            <select
              value={settings.theme}
              onChange={(e) => onUpdateSettings({ theme: e.target.value as any })}
              style={{
                backgroundColor: '#0B132B',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                padding: '4px 8px',
                fontSize: '11px',
                outline: 'none',
              }}
            >
              <option value="CYBER_DARK">Cyber Dark (Default)</option>
              <option value="VOID_OBSIDIAN">Void Obsidian</option>
              <option value="NEON_GRID">Neon Grid</option>
            </select>
          </div>

          {/* Setting 2: Render Quality */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#F8FAFC' }}>3D Render Quality</div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>WebGL antialiasing and shader passes</div>
            </div>
            <select
              value={settings.renderQuality}
              onChange={(e) => onUpdateSettings({ renderQuality: e.target.value as any })}
              style={{
                backgroundColor: '#0B132B',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                padding: '4px 8px',
                fontSize: '11px',
                outline: 'none',
              }}
            >
              <option value="HIGH">High (60 FPS + AA)</option>
              <option value="MEDIUM">Medium</option>
              <option value="PERFORMANCE">Performance Mode</option>
            </select>
          </div>

          {/* Setting 3: Harmonic Frequency Tuning */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#F8FAFC' }}>369 Fundamental Resonance</div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>Base harmonic tuning frequency</div>
            </div>
            <select
              value={settings.resonanceFrequencyHz}
              onChange={(e) => onUpdateSettings({ resonanceFrequencyHz: parseFloat(e.target.value) })}
              style={{
                backgroundColor: '#0B132B',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                padding: '4px 8px',
                fontSize: '11px',
                outline: 'none',
              }}
            >
              <option value={369.0}>369.00 Hz (Triadic Fundamental)</option>
              <option value={432.0}>432.00 Hz (Verdi Harmonic)</option>
              <option value={528.0}>528.00 Hz (Transformation)</option>
              <option value={963.0}>963.00 Hz (Pure Crown)</option>
            </select>
          </div>

          {/* Setting 4: Holographic Grid Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#F8FAFC' }}>Holographic Ground Grid</div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>Display 3D coordinate ground reference</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableHolographicGrid}
              onChange={(e) => onUpdateSettings({ enableHolographicGrid: e.target.checked })}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
          </div>

          {/* Setting 5: P2P Network Mesh Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#F8FAFC' }}>P2P Mesh Synchronization</div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>Real-time delta streaming with cluster nodes</div>
            </div>
            <input
              type="checkbox"
              checked={settings.activeP2PNetwork}
              onChange={(e) => onUpdateSettings({ activeP2PNetwork: e.target.checked })}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid #1E293B',
            backgroundColor: '#090E1E',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
