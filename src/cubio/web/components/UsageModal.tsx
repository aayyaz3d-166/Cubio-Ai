/**
 * CUBiO AI — Phase 11: Usage Telemetry Modal Component
 * src/cubio/web/components/UsageModal.tsx
 *
 * Displays authenticated tenant-scoped metrics from GET /api/v1/usage.
 */

import React, { useEffect, useState } from 'react';
import { X, BarChart3, RotateCw, AlertCircle } from 'lucide-react';
import { CubiOApiClient } from '../api/apiClient';
import { fetchUsage } from '../api/healthApi';
import { UserUsageMetrics } from '../types';

interface UsageModalProps {
  isOpen: boolean;
  client: CubiOApiClient;
  onClose: () => void;
}

export const UsageModal: React.FC<UsageModalProps> = ({
  isOpen,
  client,
  onClose,
}) => {
  const [metrics, setMetrics] = useState<UserUsageMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsage(client);
      setMetrics(data);
    } catch (err: any) {
      setError(err.detail || err.message || 'Failed to load usage statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMetrics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Usage Telemetry</h3>
              <p className="text-[11px] text-zinc-400">Tenant-scoped operational accounting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2 text-zinc-500">
              <RotateCw className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Querying /api/v1/usage...</span>
            </div>
          ) : error ? (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : metrics ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="text-[11px] text-zinc-500 font-medium">Tenant Identifier</div>
                <div className="font-mono text-xs text-zinc-200 truncate">{metrics.tenantId}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-lg font-bold text-indigo-400">{metrics.totalRequests}</div>
                  <div className="text-[10px] text-zinc-500">Total API Calls</div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-lg font-bold text-cyan-400">{metrics.conversationCount}</div>
                  <div className="text-[10px] text-zinc-500">Conversations</div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-lg font-bold text-emerald-400">{metrics.turnCount}</div>
                  <div className="text-[10px] text-zinc-500">Committed Turns</div>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 italic">
                * Note: Telemetry accounting is for operational observability. Full billing and quota contracts arrive in Phase 12.
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-xs font-medium text-zinc-300 transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
