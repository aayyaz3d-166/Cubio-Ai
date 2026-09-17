/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Spatial Query Panel UI
 *
 * Query interface with natural language prompt input and structured suggestion chips.
 */

import React, { useState } from 'react';
import { Search, Sparkles, CornerDownLeft, HelpCircle } from 'lucide-react';

export interface R11QueryPanelProps {
  readonly onExecuteQuery: (queryText: string) => void;
}

export const R11QueryPanel: React.FC<R11QueryPanelProps> = ({ onExecuteQuery }) => {
  const [inputText, setInputText] = useState('');

  const suggestions = [
    'What is above Cube_01?',
    'Which object is leftmost?',
    'Which object is highest?',
    'What is between Cylinder_01 and Sphere_01?',
    'What is near Cube_01?',
    'Path from Cube_01 to Sphere_01',
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onExecuteQuery(trimmed);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '10px 12px',
        backgroundColor: '#090D16',
        borderBottom: '1px solid #1E293B',
      }}
    >
      {/* Suggestion Chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#60A5FA', fontWeight: 'bold' }}>
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span>QUERIES:</span>
        </div>
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => {
              setInputText(sug);
              onExecuteQuery(sug);
            }}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              backgroundColor: '#1E293B',
              color: '#93C5FD',
              border: '1px solid #3B82F6',
              borderRadius: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'all 0.15s ease',
            }}
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Query Input Bar */}
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
        <Search className="w-4 h-4 text-blue-400" />
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Spatial World Model (e.g. 'What is above the cube?', 'Which object is leftmost?')..."
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
          disabled={!inputText.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 12px',
            backgroundColor: inputText.trim() ? '#2563EB' : '#1E293B',
            color: inputText.trim() ? '#FFFFFF' : '#64748B',
            border: '1px solid ' + (inputText.trim() ? '#3B82F6' : '#334155'),
            borderRadius: '6px',
            cursor: inputText.trim() ? 'pointer' : 'not-allowed',
            fontSize: '11px',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
        >
          <span>Ask</span>
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
