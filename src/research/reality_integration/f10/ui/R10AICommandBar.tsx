/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Reality AI Command Input Bar
 *
 * Natural language prompt input with suggestion chips and instant execution trigger.
 */

import React, { useState } from 'react';
import { Send, Sparkles, Mic, CornerDownLeft } from 'lucide-react';

export interface R10AICommandBarProps {
  readonly onSendCommand: (text: string) => void;
  readonly isProcessing?: boolean;
}

export const R10AICommandBar: React.FC<R10AICommandBarProps> = ({
  onSendCommand,
  isProcessing = false,
}) => {
  const [inputText, setInputText] = useState('');

  const suggestions = [
    'Create a sphere.',
    'Make it twice as large.',
    'Move it to the left.',
    'Put the sphere above the cube.',
    'Create a cylinder.',
    'Rotate it 45 degrees.',
    'Undo that.',
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isProcessing) return;
    onSendCommand(trimmed);
    setInputText('');
  };

  const handleSuggestionClick = (sug: string) => {
    onSendCommand(sug);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '10px 14px',
        backgroundColor: '#090D16',
        borderTop: '1px solid #1E293B',
      }}
    >
      {/* Quick Suggestion Chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8B5CF6', fontWeight: 'bold' }}>
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span>SUGGESTIONS:</span>
        </div>
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSuggestionClick(sug)}
            disabled={isProcessing}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              backgroundColor: '#1E1B4B',
              color: '#C4B5FD',
              border: '1px solid #4338CA',
              borderRadius: '12px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'all 0.15s ease',
            }}
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Main Input Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '6px 10px',
        }}
      >
        <Sparkles className="w-4 h-4 text-violet-400" />
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Reality AI (e.g. 'Create a sphere', 'Move it to the left', 'Make it twice as large')..."
          disabled={isProcessing}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#F8FAFC',
            fontSize: '12px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 12px',
            backgroundColor: inputText.trim() ? '#7C3AED' : '#1E293B',
            color: inputText.trim() ? '#FFFFFF' : '#64748B',
            border: '1px solid ' + (inputText.trim() ? '#8B5CF6' : '#334155'),
            borderRadius: '6px',
            cursor: inputText.trim() && !isProcessing ? 'pointer' : 'not-allowed',
            fontSize: '11px',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
        >
          <span>Send</span>
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
