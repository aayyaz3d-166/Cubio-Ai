/**
 * CubiO AI — Clean Chat View & Empty State (ChatGPT / Claude Style)
 */

import React, { useRef, useEffect } from 'react';
import {
  FileText,
  Code,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { ChatMessage, ChatMessageData } from './ChatMessage';

export interface ChatViewProps {
  readonly messages: readonly ChatMessageData[];
  readonly onSelectPrompt: (prompt: string) => void;
  readonly onRegenerate?: (messageId: string) => void;
  readonly onEditMessage?: (messageId: string, newContent: string) => void;
  readonly isLoading?: boolean;
  readonly userName?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSelectPrompt,
  onRegenerate,
  onEditMessage,
  isLoading,
  userName = 'Ayyaz',
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestions = [
    {
      title: 'Explain a Concept',
      desc: 'Intuitive, plain-English explanations',
      prompt: 'Explain quantum computing simply, using clear analogies.',
      icon: Lightbulb,
    },
    {
      title: 'Write a Business Plan',
      desc: 'Market analysis & revenue frameworks',
      prompt: 'Write me a comprehensive business plan for a new startup.',
      icon: FileText,
    },
    {
      title: 'Code & Architecture',
      desc: 'Write clean, production-ready code',
      prompt: 'Write a modular, production-ready TypeScript architecture with robust type definitions and error handling.',
      icon: Code,
    },
    {
      title: 'Search & Research',
      desc: 'Retrieve current web intelligence',
      prompt: 'Search the internet for today\'s AI news and latest model releases.',
      icon: BarChart3,
    },
  ];


  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* 1. CLEAN CHATGPT / CLAUDE STYLE EMPTY STATE */}
      {messages.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 'auto 0',
            maxWidth: '720px',
            width: '100%',
            alignSelf: 'center',
            textAlign: 'center',
            padding: '24px 0',
          }}
        >
          {/* Welcome Heading */}
          <h1
            style={{
              fontSize: '34px',
              fontWeight: 700,
              color: '#F8FAFC',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              lineHeight: 1.2,
            }}
          >
            Hello, {userName}
          </h1>

          <p
            style={{
              fontSize: '22px',
              fontWeight: 400,
              color: '#94A3B8',
              marginBottom: '36px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            How can I help you today?
          </p>

          {/* 4 Clean Suggestion Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              width: '100%',
              maxWidth: '680px',
            }}
          >
            {suggestions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => onSelectPrompt(item.prompt)}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#0A0F1E',
                    border: '1px solid #1E293B',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0F172A';
                    e.currentTarget.style.borderColor = '#38BDF8';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0A0F1E';
                    e.currentTarget.style.borderColor = '#1E293B';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#F1F5F9' }}>
                      {item.title}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.3 }}>
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* 2. CHAT MESSAGE STREAM */
        <div
          style={{
            maxWidth: '780px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onRegenerate={onRegenerate}
              onEdit={onEditMessage}
            />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: '#0A0F1E',
                border: '1px solid #1E293B',
                width: 'fit-content',
              }}
            >
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span style={{ fontSize: '13px', color: '#38BDF8', fontWeight: 500 }}>
                CubiO AI is thinking...
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
