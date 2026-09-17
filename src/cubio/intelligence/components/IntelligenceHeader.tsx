/**
 * CubiO AI — Minimal Premium AI Interface Header (ChatGPT / Claude Style)
 */

import React from 'react';
import {
  Brain,
  Plus,
  Share2,
  Sparkles,
  Database,
  SlidersHorizontal,
} from 'lucide-react';

export interface IntelligenceHeaderProps {
  readonly onNewChat: () => void;
  readonly onOpenMemory?: () => void;
  readonly onOpenSettings?: () => void;
  readonly memoryCount?: number;
}

export const IntelligenceHeader: React.FC<IntelligenceHeaderProps> = ({
  onNewChat,
  onOpenMemory,
  onOpenSettings,
  memoryCount = 0,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        padding: '0 20px',
        backgroundColor: '#070B14',
        borderBottom: '1px solid #131E35',
        userSelect: 'none',
        zIndex: 40,
      }}
    >
      {/* 1. LEFT: MINIMAL BRAND & MODEL SELECTOR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#0F1E3D',
            border: '1px solid #2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(37, 99, 235, 0.25)',
          }}
        >
          <Brain className="w-4 h-4 text-cyan-400" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#F8FAFC',
              letterSpacing: '-0.01em',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            CUB<span style={{ color: '#38BDF8' }}>i</span>O <span style={{ color: '#60A5FA' }}>AI</span>
          </span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#0B1325',
              border: '1px solid #1E293B',
              fontSize: '11px',
              color: '#94A3B8',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 500,
            }}
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>2.0 Pro</span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT: CLEAN ACTION BUTTONS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Memory Button */}
        {onOpenMemory && (
          <button
            onClick={onOpenMemory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#0B1325',
              border: '1px solid #1E293B',
              color: '#CBD5E1',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="View what CubiO remembers"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Memory {memoryCount > 0 && `(${memoryCount})`}</span>
          </button>
        )}

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '8px',
            backgroundColor: '#2563EB',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>
    </header>
  );
};
