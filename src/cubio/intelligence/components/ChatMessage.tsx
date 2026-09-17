/**
 * CubiO AI — Minimal Premium Chat Message Component (ChatGPT / Claude Style)
 */

import React, { useState } from 'react';
import {
  Brain,
  User,
  Copy,
  Check,
  RotateCcw,
  Edit2,
  CheckCheck,
} from 'lucide-react';

export interface ChatMessageData {
  readonly id: string;
  readonly role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  readonly content: string;
  readonly timestamp: number;
  readonly confidence?: number;
  readonly reasoningSteps?: readonly any[];
  readonly prediction?: any;
  readonly attachments?: readonly any[];
}

export interface ChatMessageProps {
  readonly message: ChatMessageData;
  readonly onRegenerate?: (id: string) => void;
  readonly onEdit?: (id: string, newContent: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  onEdit,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === 'USER';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  // Simple Markdown Code Block & Text Formatter
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0].trim();
        const code = (language ? lines.slice(1) : lines).join('\n');

        return (
          <div
            key={index}
            style={{
              margin: '12px 0',
              backgroundColor: '#050A14',
              borderRadius: '8px',
              border: '1px solid #1E293B',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                backgroundColor: '#0D152D',
                borderBottom: '1px solid #1E293B',
                fontSize: '11px',
                color: '#94A3B8',
                fontFamily: 'monospace',
              }}
            >
              <span>{language || 'code'}</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <pre
              style={{
                padding: '12px 16px',
                margin: 0,
                overflowX: 'auto',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '13px',
                lineHeight: 1.5,
                color: '#E2E8F0',
              }}
            >
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Paragraph formatting
      return (
        <div key={index} style={{ whiteSpace: 'pre-wrap', marginBottom: '4px' }}>
          {part}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: isUser ? '85%' : '100%',
        width: isUser ? 'auto' : '100%',
      }}
    >
      {/* Sender Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: isUser ? '#1E293B' : '#0F1E3D',
            border: isUser ? '1px solid #334155' : '1px solid #2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isUser ? (
            <User className="w-3 h-3 text-slate-300" />
          ) : (
            <Brain className="w-3 h-3 text-cyan-400" />
          )}
        </div>

        <span
          style={{
            fontSize: '12.5px',
            fontWeight: 600,
            color: isUser ? '#CBD5E1' : '#F8FAFC',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {isUser ? 'You' : 'CubiO AI'}
        </span>
      </div>

      {/* Message Bubble */}
      <div
        style={{
          backgroundColor: isUser ? '#1D4ED8' : '#0A0F1E',
          border: isUser ? 'none' : '1px solid #1E293B',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px',
          padding: '14px 18px',
          color: '#F8FAFC',
          fontSize: '14px',
          lineHeight: 1.6,
          boxShadow: isUser
            ? '0 2px 8px rgba(37, 99, 235, 0.25)'
            : '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                backgroundColor: '#0F172A',
                border: '1px solid #38BDF8',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#F8FAFC',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: 'transparent', border: '1px solid #334155', color: '#94A3B8', fontSize: '11px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{ padding: '4px 12px', borderRadius: '4px', backgroundColor: '#2563EB', border: 'none', color: '#FFFFFF', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          renderFormattedContent(message.content)
        )}
      </div>

      {/* Message Footer Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '6px' }}>
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#64748B',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '2px 4px',
          }}
          title="Copy message text"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 hover:text-slate-200" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        {/* Regenerate (for Assistant) */}
        {!isUser && onRegenerate && (
          <button
            onClick={() => onRegenerate(message.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#64748B',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '2px 4px',
            }}
            title="Regenerate response"
          >
            <RotateCcw className="w-3 h-3 hover:text-slate-200" />
            <span>Regenerate</span>
          </button>
        )}

        {/* Edit (for User) */}
        {isUser && onEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#64748B',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '2px 4px',
            }}
            title="Edit message"
          >
            <Edit2 className="w-3 h-3 hover:text-slate-200" />
            <span>Edit</span>
          </button>
        )}
      </div>
    </div>
  );
};
