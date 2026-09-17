/**
 * CubiO AI — Minimal Large AI Composer Component (ChatGPT / Claude Style)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Plus,
  Paperclip,
  Globe,
  BarChart2,
  Image,
  Wrench,
  X,
  FileText,
} from 'lucide-react';

export interface AttachedFile {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly fileObj?: File;
}

export interface MessageComposerProps {
  readonly onSendMessage: (content: string, attachments?: readonly AttachedFile[]) => void;
  readonly isLoading?: boolean;
  readonly placeholder?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = 'Ask anything...',
}) => {

  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close attach menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(52, Math.min(textareaRef.current.scrollHeight, 200))}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const clean = inputText.trim();
    if ((!clean && attachments.length === 0) || isLoading) return;

    let finalPrompt = clean;
    if (webSearchEnabled) {
      finalPrompt = `[Web Search Active] ${finalPrompt}`;
    }

    onSendMessage(finalPrompt, attachments);
    setInputText('');
    setAttachments([]);
    setWebSearchEnabled(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newAttachment: AttachedFile = {
        id: `FILE_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || file.name.split('.').pop() || 'file',
        fileObj: file,
      };
      setAttachments((prev) => [...prev, newAttachment]);
      setShowAttachMenu(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const canSubmit = (inputText.trim().length > 0 || attachments.length > 0) && !isLoading;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto',
        padding: '0 20px 16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'relative',
      }}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Main Composer Box */}
      <div
        style={{
          backgroundColor: '#0A0F1E',
          border: isFocused ? '1px solid #38BDF8' : '1px solid #1E293B',
          borderRadius: '16px',
          padding: '10px 14px',
          boxShadow: isFocused
            ? '0 4px 20px rgba(56, 189, 248, 0.15)'
            : '0 2px 8px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
      >
        {/* Attachments Chips Row */}
        {(attachments.length > 0 || webSearchEnabled) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingBottom: '4px' }}>
            {webSearchEnabled && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid #0284C7',
                  color: '#38BDF8',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                <Globe className="w-3 h-3" />
                <span>Web Search</span>
                <button
                  onClick={() => setWebSearchEnabled(false)}
                  style={{ backgroundColor: 'transparent', border: 'none', color: '#38BDF8', cursor: 'pointer', padding: 0 }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {attachments.map((att) => (
              <div
                key={att.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  color: '#F8FAFC',
                  fontSize: '11px',
                }}
              >
                <FileText className="w-3 h-3 text-cyan-400" />
                <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {att.name}
                </span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  style={{ backgroundColor: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
                >
                  <X className="w-3 h-3 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#F8FAFC',
            fontSize: '14.5px',
            lineHeight: 1.5,
            resize: 'none',
            outline: 'none',
            fontFamily: 'Inter, system-ui, sans-serif',
            minHeight: '44px',
          }}
        />

        {/* Bottom Actions Row: (+) Menu on Left, Send Button on Right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* + Attachment Button & Dropdown */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: showAttachMenu ? '#1E293B' : 'transparent',
                border: '1px solid #1E293B',
                color: showAttachMenu ? '#F8FAFC' : '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
              title="Add attachment or tool"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Attach Menu Dropdown */}
            {showAttachMenu && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '40px',
                  left: 0,
                  width: '200px',
                  backgroundColor: '#0A0F1E',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '6px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 50,
                }}
              >
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Paperclip className="w-4 h-4 text-cyan-400" />
                  <span>Upload File / Doc</span>
                </button>

                <button
                  onClick={() => {
                    setWebSearchEnabled(!webSearchEnabled);
                    setShowAttachMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>Web Search</span>
                </button>

                <button
                  onClick={() => {
                    setInputText((p) => `${p} [Data Analysis] `);
                    setShowAttachMenu(false);
                    textareaRef.current?.focus();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <span>Data Analysis</span>
                </button>

                <button
                  onClick={() => {
                    setInputText((p) => `Create an image of `);
                    setShowAttachMenu(false);
                    textareaRef.current?.focus();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Image className="w-4 h-4 text-purple-400" />
                  <span>Image Generation</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Round Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: canSubmit ? '#2563EB' : '#1E293B',
              border: 'none',
              color: canSubmit ? '#FFFFFF' : '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
              boxShadow: canSubmit ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
            }}
            title="Send Message (Enter)"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Small Disclaimer */}
      <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748B', userSelect: 'none' }}>
        CubiO AI can make mistakes. Verify important info.
      </div>
    </div>
  );
};
