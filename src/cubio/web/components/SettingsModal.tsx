/**
 * CUBiO AI — Phase 11: Settings Modal Component
 * src/cubio/web/components/SettingsModal.tsx
 *
 * User configuration controls.
 * Security Invariant: Dangerous architectural switches (NEURAL_PRIMARY, actuation lock, etc.)
 * are strictly prohibited from client exposure.
 */

import React, { useState } from 'react';
import { X, Settings, Shield, Sliders } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  apiUrl: string;
  onClose: () => void;
  onSaveApiUrl: (url: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  apiUrl,
  onClose,
  onSaveApiUrl,
}) => {
  const [urlInput, setUrlInput] = useState(apiUrl);
  const [preferredStrategy, setPreferredStrategy] = useState('SPATIAL_FIRST');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiUrl(urlInput.trim() || '/api/v1');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Studio Settings</h3>
              <p className="text-[11px] text-zinc-400">User workspace preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* API Base URL */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300">CUBiO API Base URL</label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="/api/v1"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono text-xs transition"
            />
            <p className="text-[11px] text-zinc-500">
              Default is <code className="text-zinc-400 font-mono">/api/v1</code> for local and bundled deployments.
            </p>
          </div>

          {/* Reasoning Preference */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300">Reasoning Priority</label>
            <select
              value={preferredStrategy}
              onChange={(e) => setPreferredStrategy(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500 text-xs transition"
            >
              <option value="SPATIAL_FIRST">Spatial-First Context Resolution</option>
              <option value="DETERMINISTIC_SAFE">Strict Deterministic Verification</option>
              <option value="NEURAL_SHADOW">Neural Shadow Mode (Level 4 Active)</option>
            </select>
          </div>

          {/* Architectural Guard Invariants */}
          <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 space-y-1.5 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Locked System Boundaries</span>
            </div>
            <div className="space-y-1 font-mono text-[10px]">
              <div>• Actuation: Permanently Locked (Blocked)</div>
              <div>• Neural Primary: Not Authorized (Shadow Only)</div>
              <div>• Offline Isolation: 100% Active</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
