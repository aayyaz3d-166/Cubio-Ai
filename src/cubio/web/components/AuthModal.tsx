/**
 * CUBiO AI — Phase 11: Authentication Modal Component
 * src/cubio/web/components/AuthModal.tsx
 *
 * Facilitates secure API key authentication.
 * Server remains sole authority for validating tokens and issuing roles.
 */

import React, { useState } from 'react';
import { X, Key, Shield, AlertCircle, RotateCw, CheckCircle2 } from 'lucide-react';
import { CubiOApiClient } from '../api/apiClient';
import { AuthService } from '../api/authApi';
import { UserAuthSession } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  client: CubiOApiClient;
  authService: AuthService;
  onClose: () => void;
  onAuthenticated: (session: UserAuthSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  client,
  authService,
  onClose,
  onAuthenticated,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (!token) {
      setError('Please provide a valid API token.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await authService.verifyAndAuthenticate(client, token);
      onAuthenticated(session);
      onClose();
    } catch (err: any) {
      setError(err.detail || err.message || 'Authentication failed. Verify API token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">CUBiO Authentication</h3>
              <p className="text-[11px] text-zinc-400">Authenticate with Bearer API Key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAuthenticate} className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300">Bearer API Key</label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste CUBIO_API_KEY..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono text-xs transition"
              autoFocus
            />
            <p className="text-[11px] text-zinc-500">
              Your key is sent directly to <code className="text-zinc-400 font-mono">/api/v1</code> and verified server-side.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Server-Authoritative RBAC</span>
            </div>
            <p>
              Your permissions (admin, user, readonly) are retrieved from server authority upon key validation.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Verify & Sign In</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
