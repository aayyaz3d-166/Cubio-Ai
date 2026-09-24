/**
 * CUBiO AI — Phase 11: Web Studio Navigation Component
 * src/cubio/web/components/Navigation.tsx
 */

import React from 'react';
import {
  Cpu,
  Shield,
  Activity,
  Layers,
  Settings,
  BarChart3,
  LogIn,
  LogOut,
  Menu,
  X,
  Wifi,
  WifiOff,
  CreditCard,
} from 'lucide-react';
import { SystemModelStatus, SystemReadiness, UserAuthSession } from '../types';

interface NavigationProps {
  session: UserAuthSession | null;
  modelStatus: SystemModelStatus | null;
  readiness: SystemReadiness | null;
  isOnline: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenModal: (modal: 'auth' | 'settings' | 'usage' | 'spatial' | 'account' | 'admin') => void;
  onSignOut: () => void;
  onNavigateTo3DStudio?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  session,
  modelStatus,
  readiness,
  isOnline,
  isSidebarOpen,
  onToggleSidebar,
  onOpenModal,
  onSignOut,
  onNavigateTo3DStudio,
}) => {
  const isSystemReady = readiness?.status === 'ready';

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Brand & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 md:hidden transition"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-sm shadow-indigo-500/20">
            C3
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-zinc-100">CUBiO AI</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                Web Studio
              </span>
            </div>
          </div>
        </div>

        {/* Model Status Pill (Desktop only) */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium text-[11px]">
            {modelStatus?.model || 'DETERMINISTIC_CORE'}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-[10px] uppercase font-semibold text-emerald-400">
            {modelStatus?.productionMode || 'NEURAL_SHADOW'}
          </span>
        </div>
      </div>

      {/* Right: Operational Status, Tools & Account */}
      <div className="flex items-center gap-2">
        {/* System Readiness & Network Pill */}
        <div className="hidden sm:flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isSystemReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-zinc-400 text-[11px]">
              {isSystemReady ? 'System Ready' : 'Initializing'}
            </span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1 text-zinc-400 text-[11px]">
            {isOnline ? (
              <Wifi className="w-3 h-3 text-cyan-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
            <span>{isOnline ? 'Local' : 'Offline'}</span>
          </div>
        </div>

        {/* Spatial Memory Inspector Button */}
        <button
          onClick={() => onOpenModal('spatial')}
          title="Inspect 7x7x7 Spatial Memory Grid & 369 Lattice (Read-Only)"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/80 transition flex items-center gap-1 text-xs"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="hidden xl:inline text-[11px] font-medium">3D Memory</span>
        </button>

        {/* Usage Telemetry Button */}
        {session && (
          <button
            onClick={() => onOpenModal('usage')}
            title="View Tenant-Scoped Usage Telemetry"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800/80 transition flex items-center gap-1 text-xs"
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span className="hidden xl:inline text-[11px] font-medium">Usage</span>
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={() => onOpenModal('settings')}
          title="Studio Settings"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Back to 3D Memory Studio Button */}
        {onNavigateTo3DStudio && (
          <button
            onClick={onNavigateTo3DStudio}
            title="Open 3D Spatial Memory Studio Workspace"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 transition"
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>3D Studio</span>
          </button>
        )}

        {/* Auth / Account Area */}
        {session && session.isAuthenticated ? (
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
            {session.role === 'admin' && (
              <button
                onClick={() => onOpenModal('admin')}
                title="CUBiO Admin Panel (Authoritative Governance)"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg text-indigo-200 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 shadow-sm transition"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline text-[11px]">Admin</span>
              </button>
            )}
            <button
              onClick={() => onOpenModal('account')}
              title="Account & Subscription"
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition"
            >
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline text-[11px] font-medium">Account</span>
            </button>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-zinc-200">
                {session.keyId}
              </span>
              <span className="text-[10px] text-indigo-400 uppercase font-mono tracking-wider">
                {session.role}
              </span>
            </div>
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800/80 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onOpenModal('auth')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
