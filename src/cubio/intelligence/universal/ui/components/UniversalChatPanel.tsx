/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F70: Universal Chat & Omni-Modal Composer Panel
 */

import React from 'react';
import { UniversalUIMessage } from '../types';

interface UniversalChatPanelProps {
  messages: readonly UniversalUIMessage[];
  inputText: string;
  onChangeInputText: (text: string) => void;
  onSendMessage: () => void;
  isProcessing: boolean;
  isRecordingVoice: boolean;
  onToggleVoice: () => void;
  selectedImage?: { url: string; width: number; height: number };
  onUploadImage: (url: string) => void;
}

export const UniversalChatPanel: React.FC<UniversalChatPanelProps> = ({
  messages,
  inputText,
  onChangeInputText,
  onSendMessage,
  isProcessing,
  isRecordingVoice,
  onToggleVoice,
  selectedImage,
  onUploadImage,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0d18', color: '#e0e0e8' }}>
      {/* Messages Stream */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '80px', color: '#666688' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌌</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffd700' }}>CubiO Super Intelligence Ready</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>Type a prompt, attach an image, record voice, or launch a 10-stage autonomous workflow.</div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === 'USER' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              background: msg.sender === 'USER' ? '#1c1c38' : '#141424',
              border: msg.sender === 'USER' ? '1px solid #ffd70044' : '1px solid #22223c',
              borderRadius: '12px',
              padding: '14px 18px',
              lineHeight: 1.5,
              fontSize: '14px',
            }}
          >
            <div style={{ fontSize: '10px', color: msg.sender === 'USER' ? '#ffd700' : '#00e5ff', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
              {msg.sender}
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
            {msg.imageUrl && (
              <img src={msg.imageUrl} alt="Attached" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', marginTop: '8px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Omni-Modal Composer */}
      <div style={{ borderTop: '1px solid #222238', padding: '16px 20px', background: '#0a0a12' }}>
        {selectedImage && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1a1a2e', padding: '4px 10px', borderRadius: '8px', marginBottom: '10px', fontSize: '12px', color: '#00e5ff' }}>
            <span>🖼️ Image Attached</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={onToggleVoice}
            style={{
              background: isRecordingVoice ? '#ef4444' : '#1a1a2e',
              color: isRecordingVoice ? '#fff' : '#ffd700',
              border: '1px solid #333355',
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            title="Toggle Voice STT"
          >
            🎙️
          </button>

          <button
            onClick={() => onUploadImage('https://cubio.space/assets/models/jewelry_wireframe.png')}
            style={{
              background: '#1a1a2e',
              color: '#00e5ff',
              border: '1px solid #333355',
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            title="Upload Image"
          >
            🖼️
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => onChangeInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder="Ask CubiO anything across Text, Code, 3D Spatial, Voice, Workflows..."
            style={{
              flex: 1,
              background: '#141424',
              border: '1px solid #2a2a44',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
          />

          <button
            onClick={onSendMessage}
            disabled={isProcessing}
            style={{
              background: isProcessing ? '#444455' : 'linear-gradient(135deg, #ffd700, #ffb300)',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isProcessing ? 'Processing...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
