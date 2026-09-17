/**
 * CubiO — Universal Spatial Operating Environment
 * Activity & Operation Log Modal Component
 */

import React, { useState } from 'react';
import { X, Activity, Filter, Trash2, Download } from 'lucide-react';
import { CubiOActivityLogEntry } from '../../types';

export interface CubiOActivityLogModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly logs: readonly CubiOActivityLogEntry[];
  readonly onClearLogs?: () => void;
}

export const CubiOActivityLogModal: React.FC<CubiOActivityLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (levelFilter === 'ALL') return true;
    return log.level === levelFilter;
  });

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
          width: '720px',
          maxHeight: '80vh',
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
            <Activity className="w-4 h-4 text-blue-400" />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC' }}>
              CUBiO ACTIVITY & OPERATION AUDIT LOG
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

        {/* Filter Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            backgroundColor: '#050811',
            borderBottom: '1px solid #1E293B',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'INFO', 'SUCCESS', 'RESONANCE', 'WARN', 'ERROR'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid ' + (levelFilter === lvl ? '#2563EB' : '#1E293B'),
                  backgroundColor: levelFilter === lvl ? '#1E3A8A' : '#0B132B',
                  color: levelFilter === lvl ? '#FFFFFF' : '#94A3B8',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid #7F1D1D',
                backgroundColor: '#450A0A',
                color: '#FCA5A5',
                fontSize: '9px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Log Entries */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748B', fontSize: '11px', padding: '24px' }}>
              No log entries match the selected filter.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badgeColor =
                log.level === 'SUCCESS'
                  ? '#064E3B'
                  : log.level === 'RESONANCE'
                  ? '#1E1B4B'
                  : log.level === 'WARN'
                  ? '#78350F'
                  : log.level === 'ERROR'
                  ? '#7F1D1D'
                  : '#1E293B';

              const textColor =
                log.level === 'SUCCESS'
                  ? '#34D399'
                  : log.level === 'RESONANCE'
                  ? '#C7D2FE'
                  : log.level === 'WARN'
                  ? '#FDE68A'
                  : log.level === 'ERROR'
                  ? '#FCA5A5'
                  : '#94A3B8';

              return (
                <div
                  key={log.logId}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#0B132B',
                    border: '1px solid #1E293B',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '8px',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          backgroundColor: badgeColor,
                          color: textColor,
                          fontWeight: 800,
                        }}
                      >
                        {log.level}
                      </span>
                      <span style={{ fontSize: '9px', color: '#38BDF8', fontWeight: 700, fontFamily: 'monospace' }}>
                        [{log.subsystem}]
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', color: '#64748B', fontFamily: 'monospace' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ color: '#F1F5F9', marginTop: '2px', lineHeight: '1.4' }}>
                    {log.message}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
