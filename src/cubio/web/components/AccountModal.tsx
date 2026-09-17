/**
 * CUBiO AI — Phase 12: Account & Commercial Subscription Modal
 * src/cubio/web/components/AccountModal.tsx
 *
 * Displays backend-authoritative account status, plan entitlements,
 * period usage consumption, and billing management.
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  ExternalLink,
  Zap,
  User,
  Building2,
  LogOut,
} from 'lucide-react';
import { CubiOApiClient } from '../api/apiClient';
import { fetchAccount, initiateCheckout } from '../api/billingApi';
import { AccountResponse } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  client: CubiOApiClient;
  onClose: () => void;
  onSignOut: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  client,
  onClose,
  onSignOut,
}) => {
  const [accountData, setAccountData] = useState<AccountResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAccount(client);
      setAccountData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load account and subscription details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleUpgrade = async (targetPlanId: string) => {
    setUpgrading(true);
    try {
      const result = await initiateCheckout(client, targetPlanId);
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize checkout.');
    } finally {
      setUpgrading(false);
    }
  };

  if (!isOpen) return null;

  const sub = accountData?.subscription;
  const plan = accountData?.plan;
  const usage = accountData?.usage;
  const acc = accountData?.account;

  const isProOrAbove = plan?.planId === 'PRO' || plan?.planId === 'TEAM' || plan?.planId === 'ENTERPRISE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-900/60 to-indigo-900/60 border border-indigo-800/60 text-cyan-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Account & Subscription</h3>
              <p className="text-[11px] text-zinc-400">Production commercial identity & entitlements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-zinc-500">
              <RotateCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Querying backend commercial authority...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold">Authorization Error</div>
                <div>{error}</div>
              </div>
            </div>
          ) : (
            <>
              {/* Identity Banner */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-zinc-200">Organization / Tenant</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {acc?.status || 'ACTIVE'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                  <div>
                    <div className="text-zinc-500 text-[10px]">TENANT ID</div>
                    <div className="text-zinc-300 truncate" title={acc?.tenantId}>
                      {acc?.tenantId}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[10px]">USER ID</div>
                    <div className="text-zinc-300 truncate" title={acc?.primaryUserId}>
                      {acc?.primaryUserId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan & Subscription Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-950 to-indigo-950/20 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-sm text-zinc-100">
                      {plan?.displayName || 'CubiO Standard'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      sub?.status === 'ACTIVE'
                        ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-400'
                        : sub?.status === 'TRIAL'
                        ? 'bg-blue-950/80 border-blue-700/60 text-blue-400'
                        : 'bg-amber-950/80 border-amber-700/60 text-amber-400'
                    }`}
                  >
                    {sub?.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="text-zinc-400 text-[11px]">
                  {plan?.priceCents === 0
                    ? 'Free community tier with baseline spatial reasoning.'
                    : `$${((plan?.priceCents || 0) / 100).toFixed(2)} / ${plan?.interval?.toLowerCase()}`}
                </div>

                {/* Usage Meter */}
                {usage && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Monthly Request Quota</span>
                      <span className="font-mono text-zinc-200">
                        {usage.requestCount} / {usage.maxRequests} ({usage.percentUsed}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          usage.percentUsed > 90
                            ? 'bg-red-500'
                            : usage.percentUsed > 75
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, usage.percentUsed)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>{usage.remainingRequests} requests remaining</span>
                      <span>{usage.turnCount} turns completed</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Entitlements Checklist */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Backend Verified Entitlements</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(plan?.entitlements || ['CHAT_ACCESS', 'SPATIAL_ACCESS']).map((ent) => (
                    <div
                      key={ent}
                      className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-mono text-[11px] text-zinc-300">{ent}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                {!isProOrAbove ? (
                  <button
                    onClick={() => handleUpgrade('PRO')}
                    disabled={upgrading}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{upgrading ? 'Connecting to Polar...' : 'Upgrade to Pro ($29/mo)'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade('TEAM')}
                    disabled={upgrading}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Manage Billing Portal</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="py-2.5 px-4 rounded-xl border border-red-900/60 bg-red-950/30 hover:bg-red-950/60 text-red-300 font-medium flex items-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
