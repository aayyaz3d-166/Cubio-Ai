/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Conversation Panel UI
 *
 * Interactive conversational stream displaying User messages, AI spatial plans,
 * explanations, and inline Approve/Commit/Cancel action buttons.
 */

import React, { useEffect, useRef } from 'react';
import {
  Sparkles,
  User,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AIConversationMessage, SpatialCommandPlan } from '../types';

export interface R10ConversationPanelProps {
  readonly messages: readonly AIConversationMessage[];
  readonly activePlan: SpatialCommandPlan | null;
  readonly onApprovePlan: () => void;
  readonly onCancelPlan: () => void;
}

export const R10ConversationPanel: React.FC<R10ConversationPanelProps> = ({
  messages,
  activePlan,
  onApprovePlan,
  onCancelPlan,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activePlan]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#070B14',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Conversation Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: '#090D16',
          borderBottom: '1px solid #1E293B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '5px',
              backgroundColor: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#A78BFA', letterSpacing: '0.04em' }}>
            REALITY AI CONVERSATION
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
          {messages.length} messages
        </span>
      </div>

      {/* Message Stream */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'USER';
          return (
            <div
              key={msg.messageId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '3px',
                  fontSize: '10px',
                  color: isUser ? '#818CF8' : '#A78BFA',
                  fontWeight: 700,
                }}
              >
                {isUser ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                <span>{isUser ? 'USER' : 'REALITY AI'}</span>
              </div>

              {/* Message Balloon */}
              <div
                style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: isUser ? '10px 2px 10px 10px' : '2px 10px 10px 10px',
                  backgroundColor: isUser ? '#1E1B4B' : '#0F172A',
                  border: '1px solid ' + (isUser ? '#4338CA' : '#1E293B'),
                  color: '#F1F5F9',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {msg.text}

                {/* Explanation Card if attached */}
                {msg.explanation && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#090D16',
                      border: '1px solid #334155',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                    }}
                  >
                    <div style={{ color: '#A78BFA', fontWeight: 'bold', marginBottom: '2px' }}>
                      SPATIAL EXPLANATION:
                    </div>
                    <div style={{ color: '#CBD5E1' }}>
                      Target: <strong style={{ color: '#F8FAFC' }}>{msg.explanation.targetName}</strong> | Intent: {msg.explanation.intent}
                    </div>
                    <div style={{ color: '#00FF88', marginTop: '2px' }}>
                      Reality Anchor: [{msg.explanation.realityCoordinates.join(', ')}] (ΔReality = {msg.explanation.realityMutation})
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Active Plan Preview & Approval Card */}
        {activePlan && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#1E1B4B',
              border: '1px solid #7C3AED',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity className="w-3.5 h-3.5 text-violet-400" />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#DDD6FE' }}>
                  SPATIAL PLAN READY FOR APPROVAL
                </span>
              </div>
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: '#064E3B',
                  color: '#34D399',
                  fontWeight: 'bold',
                }}
              >
                PREVIEW ACTIVE
              </span>
            </div>

            <div style={{ fontSize: '12px', color: '#F8FAFC', fontWeight: 600 }}>
              {activePlan.summary}
            </div>

            <div style={{ fontSize: '10px', color: '#A5B4FC', fontFamily: 'monospace' }}>
              Operations: {activePlan.operations.length} step(s) | Reality Mutation: 0 (Invariant)
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={onApprovePlan}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '6px',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  border: '1px solid #10B981',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve & Commit</span>
              </button>

              <button
                onClick={onCancelPlan}
                style={{
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#991B1B',
                  color: '#FFFFFF',
                  border: '1px solid #DC2626',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                }}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
