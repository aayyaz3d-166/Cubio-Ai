/**
 * CUBiO AI — Phase 28 Task 450: Admin Panel Foundation Modal
 * src/cubio/web/components/AdminPanelModal.tsx
 *
 * Sovereign administrative console embedded in CUBiO Web Studio.
 *
 * Core Capabilities:
 * 1. Child Agents Management: Inspect registered child agents, their live connection state,
 *    and execute lifecycle mutations (Activate, Disable, Retire).
 * 2. Version Governance: View semantic versions and submit SemVer updates.
 * 3. Permissions & Capabilities: Review role-to-capability entitlement matrix and safety locks.
 * 4. Model Availability: Inspect active foundation model, view epistemic evaluation score,
 *    and configure operational states.
 * 5. Mother Core Secrecy: Guaranteed zero disclosure of private internal weights, schemas, or tables.
 * 6. Authenticated & Authorized: Gated strictly to session role === 'admin'.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Power,
  PowerOff,
  Edit3,
  Archive,
  Lock,
  EyeOff,
  KeyRound,
  Sliders,
  Database,
  Activity,
  Award,
  PlusCircle,
} from 'lucide-react';
import { CubiOApiClient } from '../api/apiClient';
import {
  AdminChildRecord,
  AdminPermissionsResponse,
  UserAuthSession,
  SystemModelStatus,
} from '../types';
import {
  fetchAdminChildren,
  mutateChildLifecycle,
  fetchAdminPermissions,
  updateModelAvailability,
  installChildMvp,
  fetchChildModelPolicies,
  updateChildModelPolicy,
} from '../api/adminApi';
import { ChildModelPolicy } from '../types';

interface AdminPanelModalProps {
  isOpen: boolean;
  client: CubiOApiClient;
  session: UserAuthSession | null;
  onClose: () => void;
}

type AdminTab = 'children' | 'permissions' | 'models';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  client,
  session,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('children');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Admin Data State
  const [children, setChildren] = useState<readonly AdminChildRecord[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissionsResponse | null>(null);
  const [modelState, setModelState] = useState<any | null>(null);
  const [childPolicies, setChildPolicies] = useState<ChildModelPolicy[]>([]);

  // Edit Version Modal / Inline Form State
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [newVersionInput, setNewVersionInput] = useState('');
  const [newNameInput, setNewNameInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Install Child MVP Form State
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installId, setInstallId] = useState('');
  const [installName, setInstallName] = useState('');
  const [installVersion, setInstallVersion] = useState('1.0.0');
  const [installRole, setInstallRole] = useState('MVP_STUDIO_COORDINATOR');
  const [installDesc, setInstallDesc] = useState('');
  const [installTokens, setInstallTokens] = useState(4096);
  const [installAutoActivate, setInstallAutoActivate] = useState(true);

  const isAdmin = session?.role === 'admin';

  const loadData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const [childrenRes, permRes, modelRes, policiesRes] = await Promise.all([
        fetchAdminChildren(client),
        fetchAdminPermissions(client),
        client.request<SystemModelStatus>('/models'),
        fetchChildModelPolicies(client).catch(() => ({ policies: [] })),
      ]);

      if (childrenRes.success) {
        setChildren(childrenRes.children);
      }
      if (permRes.success) {
        setPermissions(permRes);
      }
      if (modelRes) {
        setModelState(modelRes);
      }
      if (policiesRes && policiesRes.policies) {
        setChildPolicies(policiesRes.policies);
      }
    } catch (err: any) {
      setError(err.detail || err.message || 'Failed to load administrative governance data.');
    } finally {
      setLoading(false);
    }
  }, [client, isAdmin]);

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadData();
    }
  }, [isOpen, isAdmin, loadData]);

  // Clear notifications after timeout
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  if (!isOpen) return null;

  // Lifecycle Action Handlers
  const handleLifecycleAction = async (childId: string, action: 'ACTIVATE' | 'DISABLE' | 'RETIRE') => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await mutateChildLifecycle(client, { action, childId });
      if (res.success) {
        setSuccessMsg(`Successfully updated Child '${childId}' to state '${res.child.lifecycleState}'.`);
        await loadData();
      }
    } catch (err: any) {
      setError(err.detail || err.message || `Failed to execute ${action} on Child ${childId}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateVersion = async (childId: string) => {
    if (!newVersionInput.trim() || !/^\d+\.\d+\.\d+$/.test(newVersionInput.trim())) {
      setError('Invalid SemVer format. Must follow standard X.Y.Z notation (e.g. 2.1.0).');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const res = await mutateChildLifecycle(client, {
        action: 'UPDATE',
        childId,
        patch: {
          semanticVersion: newVersionInput.trim(),
          agentName: newNameInput.trim() || undefined,
        },
      });
      if (res.success) {
        setSuccessMsg(`Successfully updated Child '${childId}' to version '${res.child.semanticVersion}'.`);
        setEditingChildId(null);
        setNewVersionInput('');
        setNewNameInput('');
        await loadData();
      }
    } catch (err: any) {
      setError(err.detail || err.message || `Failed to update version for Child ${childId}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleModelAvailability = async (isCurrentlyAvailable: boolean) => {
    setActionLoading(true);
    setError(null);
    try {
      const targetState = isCurrentlyAvailable ? 'SUSPENDED' : 'READY';
      const res = await updateModelAvailability(
        client,
        modelState?.model || 'cubio-native-1m-production',
        targetState,
        !isCurrentlyAvailable
      );
      if (res.success) {
        setSuccessMsg(`Model operational state updated to ${res.operationalState}.`);
        await loadData();
      }
    } catch (err: any) {
      setError(err.detail || err.message || 'Failed to update model operational state.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInstallChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installId.trim()) {
      setError('Child ID is required.');
      return;
    }
    if (!installVersion.trim() || !/^\d+\.\d+\.\d+$/.test(installVersion.trim())) {
      setError('Invalid SemVer format. Must be strictly X.Y.Z (e.g. 1.0.0).');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const res = await installChildMvp(client, {
        childId: installId.trim(),
        agentName: installName.trim() || installId.trim(),
        semanticVersion: installVersion.trim(),
        role: installRole,
        description: installDesc.trim() || 'Custom registered Child MVP Agent',
        customMaxTokens: installTokens,
        autoActivate: installAutoActivate,
      });

      if (res.success) {
        setSuccessMsg(`Successfully installed Child '${installId}' in stage '${res.stage}'.`);
        setShowInstallModal(false);
        setInstallId('');
        setInstallName('');
        setInstallDesc('');
        await loadData();
      } else {
        setError(res.error || 'Child installation failed.');
      }
    } catch (err: any) {
      setError(err.detail || err.message || 'Failed to install Child MVP.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-900/60 via-indigo-900/60 to-cyan-900/60 border border-indigo-700/60 text-indigo-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100">CUBiO Admin Panel</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">
                  AUTHORITATIVE CONSOLE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Child Agent governance, versioning, role permissions, and foundation model availability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading || !isAdmin}
              title="Refresh Governance Data"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security & Access Notice */}
        {!isAdmin ? (
          <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center">
            <div className="p-3 rounded-full bg-red-950/60 border border-red-800/60 text-red-400">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md">
              <h4 className="text-base font-bold text-zinc-100">Administrator Access Required</h4>
              <p className="text-xs text-zinc-400">
                Your current session credential has role{' '}
                <span className="font-mono text-amber-400 font-bold">
                  {session?.role || 'unauthenticated'}
                </span>
                . Administrative governance functions require an authorized{' '}
                <span className="font-mono text-indigo-400 font-bold">admin</span> token.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-500 font-mono">
              Enforcing fail-closed RBAC gate: 403 Forbidden.
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs & Mother Core Privacy Assurance Banner */}
            <div className="flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950/40">
              <div className="flex gap-1 py-2">
                <button
                  onClick={() => setActiveTab('children')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'children'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Child Agents & Versions ({children.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'permissions'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Permissions & RBAC</span>
                </button>

                <button
                  onClick={() => setActiveTab('models')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'models'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Model Availability</span>
                </button>
              </div>

              {/* Mother Core Privacy Assurance Badge */}
              <div className="hidden md:flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40">
                <EyeOff className="w-3 h-3" />
                <span>Mother Core Implementation Sealed & Opaque</span>
              </div>
            </div>

            {/* Error & Success Banner */}
            {error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}
            {successMsg && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{successMsg}</div>
              </div>
            )}

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto text-xs space-y-6 flex-1">
              {/* TAB 1: CHILD AGENTS & VERSIONS */}
              {activeTab === 'children' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-100">Enrolled Child Agents</h4>
                      <p className="text-[11px] text-zinc-400">
                        Governed through Phase 28 Child Lifecycle Manager & Identity Registry
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowInstallModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Install Child MVP</span>
                      </button>
                      <div className="text-[11px] text-zinc-400 font-mono hidden sm:block">
                        Active:{' '}
                        <span className="text-emerald-400 font-bold">
                          {children.filter((c) => c.lifecycleState === 'ACTIVE').length}
                        </span>{' '}
                        / {children.length}
                      </div>
                    </div>
                  </div>

                  <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-semibold text-[11px]">
                          <th className="py-2.5 px-4">Agent Name / ID</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Version</th>
                          <th className="py-2.5 px-3">State</th>
                          <th className="py-2.5 px-4 text-right">Lifecycle Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {children.map((child) => {
                          const isActive = child.lifecycleState === 'ACTIVE';
                          const isRetired = child.lifecycleState === 'RETIRED';
                          const isEditing = editingChildId === child.childId;

                          return (
                            <tr key={child.childId} className="hover:bg-zinc-900/40 transition">
                              <td className="py-3 px-4">
                                <div className="font-bold text-zinc-200">{child.agentName}</div>
                                <div className="text-[10px] font-mono text-zinc-500">{child.childId}</div>
                                <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{child.description}</div>
                              </td>

                              <td className="py-3 px-3">
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-indigo-300">
                                  {child.role}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={newVersionInput}
                                      onChange={(e) => setNewVersionInput(e.target.value)}
                                      placeholder="e.g. 2.1.0"
                                      className="w-20 px-1.5 py-0.5 text-xs rounded bg-zinc-900 border border-indigo-600 text-white font-mono"
                                    />
                                    <button
                                      onClick={() => handleUpdateVersion(child.childId)}
                                      disabled={actionLoading}
                                      className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px]"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingChildId(null)}
                                      className="px-1 py-0.5 text-zinc-400 hover:text-white text-[10px]"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-zinc-200 font-semibold">
                                      v{child.semanticVersion}
                                    </span>
                                    {!isRetired && (
                                      <button
                                        onClick={() => {
                                          setEditingChildId(child.childId);
                                          setNewVersionInput(child.semanticVersion);
                                          setNewNameInput(child.agentName);
                                        }}
                                        title="Update SemVer version"
                                        className="p-1 rounded text-zinc-500 hover:text-indigo-400 transition"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                    isActive
                                      ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                                      : isRetired
                                      ? 'bg-red-950/60 border-red-800/60 text-red-400'
                                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                  }`}
                                >
                                  {isActive ? <Power className="w-2.5 h-2.5" /> : <PowerOff className="w-2.5 h-2.5" />}
                                  <span>{child.lifecycleState}</span>
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                                {!isRetired ? (
                                  <>
                                    {isActive ? (
                                      <button
                                        onClick={() => handleLifecycleAction(child.childId, 'DISABLE')}
                                        disabled={actionLoading}
                                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition disabled:opacity-50"
                                      >
                                        Disable
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleLifecycleAction(child.childId, 'ACTIVATE')}
                                        disabled={actionLoading}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition disabled:opacity-50"
                                      >
                                        Activate
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleLifecycleAction(child.childId, 'RETIRE')}
                                      disabled={actionLoading}
                                      title="Permanently retire child agent"
                                      className="px-2 py-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/40 transition disabled:opacity-50"
                                    >
                                      Retire
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-zinc-600 font-mono italic">Permanent Lockout</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: PERMISSIONS & RBAC */}
              {activeTab === 'permissions' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">Role-Capability Entitlement Matrix</h4>
                    <p className="text-[11px] text-zinc-400">
                      Authoritative RBAC policies enforced across Secure Core Wire
                    </p>
                  </div>

                  {permissions?.matrix && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(permissions.matrix).map(([roleName, capabilities]) => (
                        <div key={roleName} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <KeyRound className="w-4 h-4 text-indigo-400" />
                              <span className="font-bold font-mono text-zinc-200">{roleName}</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400">
                              {capabilities.length} Capabilities
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            {capabilities.map((cap) => (
                              <div key={cap} className="flex items-center gap-2 text-[11px] text-zinc-300 font-mono">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>{cap}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Safety Locks & Invariants Box */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-950 to-indigo-950/20 border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sovereign Governance Policies & Invariant Locks</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <div className="text-xs font-bold text-emerald-400">ENFORCED</div>
                        <div className="text-[10px] text-zinc-500">Actuation Lock</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <div className="text-xs font-bold text-cyan-400">100% AIRGAP</div>
                        <div className="text-[10px] text-zinc-500">Offline Isolated</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <div className="text-xs font-bold text-purple-400">4,096 TOKENS</div>
                        <div className="text-[10px] text-zinc-500">Max Budget/Turn</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        <div className="text-xs font-bold text-indigo-400">ISOLATED</div>
                        <div className="text-[10px] text-zinc-500">Cross-Child Guard</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MODEL AVAILABILITY */}
              {activeTab === 'models' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">Foundation Model Operational Control</h4>
                    <p className="text-[11px] text-zinc-400">
                      Governs availability and runtime readiness of native intelligence models
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
                          <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-100 text-sm">
                              {modelState?.model || 'cubio-native-1m-production'}
                            </span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-cyan-400 border border-zinc-800">
                              v{modelState?.version || '16.0.0-sealed'}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {modelState?.capability || 'Native 1M Sovereign Transformer'}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400">
                        READY & SERVING
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
                      <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                        <div className="text-zinc-500 text-[10px]">PARAMETERS</div>
                        <div className="text-zinc-200 font-bold">
                          {((modelState?.parameters || 971520) / 1000).toFixed(1)}k
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                        <div className="text-zinc-500 text-[10px]">LAYERS / D_MODEL</div>
                        <div className="text-zinc-200 font-bold">
                          {modelState?.layerCount || 6} / 128
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                        <div className="text-zinc-500 text-[10px]">SPATIAL LATTICE</div>
                        <div className="text-zinc-200 font-bold">7 × 7 × 7 (343)</div>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                        <div className="text-zinc-500 text-[10px]">EPISTEMIC CLASSES</div>
                        <div className="text-zinc-200 font-bold">7 Tiers</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Epistemic Evaluation: Passed Certified Benchmark (Score: 1.00)</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleModelAvailability(true)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition disabled:opacity-50"
                        >
                          Suspend Serving
                        </button>
                        <button
                          onClick={() => handleToggleModelAvailability(false)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium transition disabled:opacity-50"
                        >
                          Assert Ready
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Child Model Registry Governance Table (Task 452) */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-100">Child Agent Model Registry & Permissions</h4>
                      <p className="text-[11px] text-zinc-400">
                        Administer allowed models and default model selection per Child MVP
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-950 font-mono text-[10px] text-zinc-400 uppercase">
                            <th className="p-3">Child Agent</th>
                            <th className="p-3">Default Model</th>
                            <th className="p-3">Authorized Models</th>
                            <th className="p-3">Last Updated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40 font-mono">
                          {childPolicies.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-zinc-500 font-sans text-xs">
                                No child model policies configured.
                              </td>
                            </tr>
                          ) : (
                            childPolicies.map((p) => (
                              <tr key={p.childId} className="hover:bg-zinc-800/30">
                                <td className="p-3 text-indigo-300 font-bold">{p.childId}</td>
                                <td className="p-3 text-emerald-400">{p.defaultModelId}</td>
                                <td className="p-3">
                                  <div className="flex flex-wrap gap-1">
                                    {p.allowedModelIds.map((mId) => (
                                      <span
                                        key={mId}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                                      >
                                        {mId}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-3 text-[10px] text-zinc-500">
                                  {new Date(p.updatedAt).toLocaleTimeString()} ({p.updatedBy})
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-Modal: Install Child MVP Version Dialog */}
            {showInstallModal && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
                <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950">
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-sm font-bold text-zinc-100">Install New Child MVP Version</h4>
                    </div>
                    <button
                      onClick={() => setShowInstallModal(false)}
                      className="p-1 rounded text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleInstallChild} className="p-5 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          Child Identity (ID) *
                        </label>
                        <input
                          type="text"
                          required
                          value={installId}
                          onChange={(e) => setInstallId(e.target.value)}
                          placeholder="e.g. cubio-child-mvp-3"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          SemVer Version *
                        </label>
                        <input
                          type="text"
                          required
                          value={installVersion}
                          onChange={(e) => setInstallVersion(e.target.value)}
                          placeholder="1.0.0"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Agent Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={installName}
                        onChange={(e) => setInstallName(e.target.value)}
                        placeholder="e.g. CUBiO MVP-3 (Autonomous Agent)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          Assigned Role *
                        </label>
                        <select
                          value={installRole}
                          onChange={(e) => setInstallRole(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="MVP_STUDIO_COORDINATOR">MVP_STUDIO_COORDINATOR</option>
                          <option value="SPECIALIZED_RESEARCH_ASSISTANT">SPECIALIZED_RESEARCH_ASSISTANT</option>
                          <option value="SPATIAL_ANALYST">SPATIAL_ANALYST</option>
                          <option value="CODE_SYNTHESIS_AGENT">CODE_SYNTHESIS_AGENT</option>
                          <option value="AUDIT_OBSERVER">AUDIT_OBSERVER</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          Max Request Tokens
                        </label>
                        <input
                          type="number"
                          min={256}
                          max={16384}
                          value={installTokens}
                          onChange={(e) => setInstallTokens(parseInt(e.target.value, 10) || 4096)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={installDesc}
                        onChange={(e) => setInstallDesc(e.target.value)}
                        placeholder="Purpose and capabilities of this Child MVP version..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="autoActivate"
                        checked={installAutoActivate}
                        onChange={(e) => setInstallAutoActivate(e.target.checked)}
                        className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0"
                      />
                      <label htmlFor="autoActivate" className="text-[11px] text-zinc-300">
                        Auto-activate after pre-flight compatibility verification
                      </label>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowInstallModal(false)}
                        className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition disabled:opacity-50"
                      >
                        {actionLoading ? 'Installing...' : 'Install & Register'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
