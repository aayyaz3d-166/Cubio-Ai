/**
 * CubiO — Universal Spatial Operating Environment
 * Exact Reference Top Navigation Bar
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Brain,
  Network,
} from 'lucide-react';
import { CubiOCoreStatus, CubiODimension } from '../../types';

export interface CubiOTopBarProps {
  readonly coreStatus: CubiOCoreStatus;
  readonly activeDimension: CubiODimension;
  readonly activeFrequencyHz: number;
  readonly unreadLogsCount: number;
  readonly onOpenLogs: () => void;
  readonly onOpenSettings: () => void;
  readonly onExit?: () => void;
  readonly onNavigateToIntelligence?: () => void;
  readonly onNavigateToNetwork?: () => void;
  readonly onQuickAction?: (actionId: string) => void;
  readonly onSearchChange?: (query: string) => void;
}

export const CubiOTopBar: React.FC<CubiOTopBarProps> = ({
  coreStatus,
  activeDimension,
  activeFrequencyHz,
  unreadLogsCount,
  onOpenLogs,
  onOpenSettings,
  onExit,
  onNavigateToIntelligence,
  onNavigateToNetwork,
  onQuickAction,
  onSearchChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [currentTime, setCurrentTime] = useState('14:32:45');
  const [currentDate, setCurrentDate] = useState('16 May 2025');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setCurrentDate(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange?.(e.target.value);
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 24px 0 0',
        userSelect: 'none',
        zIndex: 50,
        position: 'relative',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* 1. LEFT BRAND BADGE (Dark Curved Tab Matching Reference) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#070D1A',
          height: '100%',
          padding: '0 32px 0 20px',
          borderTopRightRadius: '28px',
          borderBottomRightRadius: '28px',
          boxShadow: '4px 0 12px rgba(0, 0, 0, 0.12)',
          position: 'relative',
        }}
      >
        {/* Golden Isometric Cube Icon */}
        <div style={{ width: '36px', height: '36px', position: 'relative' }}>
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
            <polygon
              points="50,15 85,35 50,55 15,35"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="4"
            />
            <polygon
              points="15,35 50,55 50,92 15,72"
              fill="none"
              stroke="#D97706"
              strokeWidth="4"
            />
            <polygon
              points="50,55 85,35 85,72 50,92"
              fill="none"
              stroke="#B45309"
              strokeWidth="4"
            />
            <circle cx="50" cy="55" r="5" fill="#FDE68A" />
            <line x1="50" y1="15" x2="50" y2="55" stroke="#FDE68A" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
        </div>

        {/* Brand Text */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span
            style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#FFFFFF',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            CubiO
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '0.22em',
              color: '#38BDF8',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
            }}
          >
            DIMENSION
          </span>
        </div>

      </div>

      {/* 2. CENTER: GLOBAL SEARCH PILL */}
      <div style={{ flex: 1, maxWidth: '520px', margin: '0 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '24px',
            padding: '8px 18px',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)',
          }}
        >
          <input
            type="text"
            placeholder="Search states, patterns, memories..."
            value={searchQuery}
            onChange={handleSearch}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '13px',
              color: '#334155',
              width: '100%',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          />
          <Search className="w-4 h-4 text-slate-400 shrink-0 cursor-pointer" />
        </div>
      </div>

      {/* 3. RIGHT CONTROLS: THEME, NOTIFICATIONS, SETTINGS, STATUS, PROFILE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Light / Dark Mode Toggle */}
        <div
          onClick={() => setIsDarkTheme(!isDarkTheme)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            backgroundColor: '#F1F5F9',
            borderRadius: '20px',
            cursor: 'pointer',
          }}
        >
          <Sun className="w-4 h-4 text-amber-500" />
          <Moon className="w-4 h-4 text-slate-600" />
        </div>

        {/* Notification Bell with Badge */}
        <div
          onClick={onOpenLogs}
          style={{ position: 'relative', cursor: 'pointer' }}
          title="Activity Notifications"
        >
          <Bell className="w-5 h-5 text-slate-700 hover:text-amber-600 transition-colors" />
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-6px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#D97706',
              color: '#FFFFFF',
              fontSize: '9.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #FFFFFF',
            }}
          >
            {unreadLogsCount > 0 ? unreadLogsCount : 3}
          </span>
        </div>

        {/* Settings Gear */}
        <div onClick={onOpenSettings} style={{ cursor: 'pointer' }} title="System Settings">
          <Settings className="w-5 h-5 text-slate-700 hover:text-amber-600 transition-colors" />
        </div>

        {/* Help Circle */}
        <div style={{ cursor: 'pointer' }} title="CubiO Knowledge & Help">
          <HelpCircle className="w-5 h-5 text-slate-700 hover:text-amber-600 transition-colors" />
        </div>

        {/* Thin Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: '#E2E8F0' }} />

        {/* System Status */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
            System Status
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#059669',
                fontFamily: 'monospace',
              }}
            >
              {coreStatus === 'ONLINE' ? 'ONLINE' : coreStatus}
            </span>
          </div>
        </div>

        {/* Clock & Date */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, fontFamily: 'monospace' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
            {currentTime}
          </span>
          <span style={{ fontSize: '10px', color: '#64748B' }}>
            {currentDate}
          </span>
        </div>

        {/* Profile Pill with Golden Avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 12px 4px 6px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '24px',
            cursor: 'pointer',
          }}
        >
          {/* Avatar Icon */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#070D1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #D97706',
            }}
          >
            <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 900 }}>⚡</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
              CubiO Core
            </span>
            <span style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 500 }}>
              Administrator
            </span>
          </div>
        </div>

        {/* CUBiO Intelligence Navigation Button */}
        {onNavigateToIntelligence && (
          <button
            onClick={onNavigateToIntelligence}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#0F172A',
              border: '1px solid #38BDF8',
              borderRadius: '20px',
              color: '#38BDF8',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)',
              transition: 'all 0.15s ease',
            }}
            title="Open CUBiO Intelligence Assistant Workspace"
          >
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span>Intelligence AI</span>
          </button>
        )}

        {/* CUBiO Network Navigation Button */}
        {onNavigateToNetwork && (
          <button
            onClick={onNavigateToNetwork}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#0F172A',
              border: '1px solid #F59E0B',
              borderRadius: '20px',
              color: '#F59E0B',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)',
              transition: 'all 0.15s ease',
            }}
            title="Open CUBiO Network & Sovereignty Hub"
          >
            <Network className="w-3.5 h-3.5 text-amber-400" />
            <span>Network Hub</span>
          </button>
        )}

        {/* Exit Button if in sub-mode */}
        {onExit && (
          <button
            onClick={onExit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Return to Research Studio"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        )}
      </div>
    </header>
  );
};
