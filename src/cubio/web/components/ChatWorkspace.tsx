/**
 * CUBiO AI — Phase 11: Chat Workspace Component
 * src/cubio/web/components/ChatWorkspace.tsx
 *
 * Implements conversational interface, safe message rendering,
 * composer, thinking indicator, and idempotent retry error banner.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  Bot,
  User,
  Sparkles,
  ShieldAlert,
  Clock,
  Terminal,
  Cpu,
} from 'lucide-react';
import { ChatMessage, MessageStatus, ChildModelDescriptor } from '../types';

interface ChatWorkspaceProps {
  messages: ChatMessage[];
  isSubmitting: boolean;
  activeConversationTitle: string;
  onSendMessage: (text: string, existingRequestId?: string) => Promise<void>;
  onRetryMessage: (failedMessage: ChatMessage) => Promise<void>;
  availableModels?: ChildModelDescriptor[];
  selectedModelId?: string;
  onSelectModel?: (modelId: string) => void;
}

// Helper to escape HTML characters and prevent XSS
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatMarkdownContent(raw: string): string {
  // Safe HTML escaped markdown parser
  // First escape raw HTML to neutralize XSS
  const safe = escapeHtml(raw);
  // Code blocks: ```lang ... ``` -> <pre class="..."><code>...</code></pre>
  const withCode = safe.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<pre class="language-${lang || 'code'}"><code class="language-${lang || 'code'}">${code}</code></pre>`;
  });
  // Inline code: `...`
  const withInline = withCode.replace(/`([^`]+)`/g, '<code class="bg-zinc-800 px-1 py-0.5 rounded text-indigo-300">$1</code>');
  // Bold: **...**
  const withBold = withInline.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *...*
  const withItalic = withBold.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return withItalic;
}

// Simple safe markdown renderer without dangerous external dependencies or eval
const SafeMarkdownView: React.FC<{ content: string }> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (code: string, idx: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // Split content by code fences: ```language ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-sm leading-relaxed break-words">
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const lang = lines[0]?.trim() || 'code';
          const code = (lines.length > 1 ? lines.slice(1).join('\n') : lines[0]) || '';

          return (
            <div
              key={i}
              className="my-3 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 font-mono text-xs"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                <span className="flex items-center gap-1.5 font-semibold text-[11px] lowercase text-zinc-300">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  {lang}
                </span>
                <button
                  onClick={() => handleCopy(code, i)}
                  className="flex items-center gap-1 text-[10px] hover:text-zinc-100 transition"
                  title="Copy code"
                >
                  {copiedIndex === i ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-zinc-200 selection:bg-indigo-900">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Render standard text lines
        const paragraphs = part.split('\n\n').filter(Boolean);
        return (
          <div key={i} className="space-y-1.5">
            {paragraphs.map((p, pIdx) => {
              // Parse basic bold **text** and `inline code`
              const formatted = p.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((segment, sIdx) => {
                if (segment.startsWith('`') && segment.endsWith('`')) {
                  return (
                    <code
                      key={sIdx}
                      className="px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-300 font-mono text-xs"
                    >
                      {segment.slice(1, -1)}
                    </code>
                  );
                }
                if (segment.startsWith('**') && segment.endsWith('**')) {
                  return (
                    <strong key={sIdx} className="font-semibold text-zinc-100">
                      {segment.slice(2, -2)}
                    </strong>
                  );
                }
                return segment;
              });

              return (
                <p key={pIdx} className="text-zinc-300">
                  {formatted}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  messages,
  isSubmitting,
  activeConversationTitle,
  onSendMessage,
  onRetryMessage,
  availableModels = [],
  selectedModelId,
  onSelectModel,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom upon new message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting, scrollToBottom]);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: allow default behavior to insert newline
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const text = inputText.trim();
    if (!text || isSubmitting) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage(text);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden relative">
      {/* Top Conversation Header */}
      <div className="h-11 px-4 border-b border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 truncate">
          <span className="font-semibold text-xs text-zinc-300 truncate">
            {activeConversationTitle || 'Conversation Workspace'}
          </span>

          {/* Model Selector Dropdown (Task 452) */}
          {availableModels && availableModels.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-zinc-900/80 border border-zinc-700/60 rounded-md px-2 py-0.5">
              <Cpu className="w-3 h-3 text-indigo-400" />
              <select
                id="model-selector-dropdown"
                value={selectedModelId || (availableModels[0]?.id ?? '')}
                onChange={(e) => onSelectModel && onSelectModel(e.target.value)}
                className="bg-transparent text-[11px] font-mono text-zinc-300 focus:outline-none cursor-pointer pr-1"
                aria-label="Select Authorized Model"
              >
                {availableModels.map((m) => (
                  <option
                    key={m.id}
                    value={m.id}
                    disabled={m.status === 'SUSPENDED'}
                    className="bg-zinc-900 text-zinc-200"
                  >
                    {m.name} {m.status === 'SUSPENDED' ? '(Suspended)' : ''} {m.isDefault ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-[11px] text-zinc-500 font-mono">
          {messages.length} messages
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-950/40">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-zinc-100">
                CUBiO AI Intelligence Workspace
              </h2>
              <p className="text-xs text-zinc-400">
                Connected to CUBiO AI Deterministic Spatial & Context Engine (No Trained Model / Clean State).
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full pt-2">
              {[
                'Explain 3D Spatial Memory and the 369 lattice address system.',
                'Analyze harmonic modal decomposition for entity coordinates.',
                'What is the difference between simulated and live observations?',
              ].map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(promptText)}
                  className="text-left px-3 py-2 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 hover:text-zinc-100 transition"
                >
                  "{promptText}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isError = msg.status === 'error';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`
                    flex flex-col space-y-1.5 max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 shadow-sm
                    ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : isError
                        ? 'bg-red-950/40 border border-red-800/50 rounded-tl-none text-red-200'
                        : 'bg-zinc-900 border border-zinc-800 rounded-tl-none text-zinc-200'
                    }
                  `}
                >
                  {/* Message Content */}
                  {isUser ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : isError ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Intelligence Error</span>
                      </div>
                      <p className="text-xs text-red-300">{msg.error || 'Failed to complete request.'}</p>
                      <button
                        onClick={() => onRetryMessage(msg)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 border border-red-700/50 text-xs font-medium text-white transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry (Idempotent)</span>
                      </button>
                    </div>
                  ) : (
                    <SafeMarkdownView content={msg.content || 'Response committed.'} />
                  )}

                  {/* Metadata Footer */}
                  {!isUser && !isError && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-500">
                      {msg.epistemicState && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 font-semibold uppercase tracking-wider">
                          {msg.epistemicState}
                        </span>
                      )}
                      {msg.confidence !== undefined && (
                        <span>Conf: {(msg.confidence * 100).toFixed(1)}%</span>
                      )}
                      {msg.latencyMs !== undefined && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {msg.latencyMs}ms
                        </span>
                      )}
                      {msg.sequence !== undefined && (
                        <span>Seq #{msg.sequence}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Processing Indicator */}
        {isSubmitting && (
          <div className="flex gap-3 max-w-3xl mr-auto justify-start">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl rounded-tl-none bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-150" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-300" />
              <span className="ml-1 text-zinc-400 font-medium">
                Reasoning through Shadow Runtime...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Area */}
      <div className="p-3 sm:p-4 border-t border-zinc-800/80 bg-zinc-950 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(e);
          }}
          action="#"
          method="dialog"
          className="max-w-3xl mx-auto flex flex-col space-y-2"
        >
          <div className="relative flex items-end rounded-xl border border-zinc-800 bg-zinc-900/80 focus-within:border-indigo-500 transition shadow-sm">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              rows={1}
              maxLength={4000}
              aria-label="Message input"
              placeholder="Ask CUBiO AI... (Enter to send, Shift+Enter for newline)"
              className="w-full resize-none bg-transparent py-3 pl-3.5 pr-12 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none max-h-[180px] overflow-y-auto"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit(e);
              }}
              disabled={!inputText.trim() || isSubmitting}
              aria-label="Send message"
              className={`
                absolute right-2.5 bottom-2.5 p-2 rounded-lg transition
                ${
                  !inputText.trim() || isSubmitting
                    ? 'text-zinc-600 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                }
              `}
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
            <span>Server-Authoritative • Level 4 Spatial Intelligence</span>
            <span>{inputText.length} / 4000</span>
          </div>
        </form>
      </div>
    </div>
  );
};
