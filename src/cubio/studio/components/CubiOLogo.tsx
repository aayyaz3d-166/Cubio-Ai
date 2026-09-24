/**
 * CubiO — Universal Spatial Operating Environment
 * Phase VIP: Brand Logo & Visual Identity Component (Enterprise Gold & Sapphire)
 */

import React from 'react';

export interface CubiOLogoProps {
  readonly size?: number;
  readonly showLabel?: boolean;
}

export const CubiOLogo: React.FC<CubiOLogoProps> = ({ size = 32, showLabel = true }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', userSelect: 'none' }}>
      {/* 369 Isometric Hyper-Cube SVG Icon with Metallic Gold & Sapphire Accents */}
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <defs>
            <linearGradient id="vipGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="vipNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0B1120" />
            </linearGradient>
            <linearGradient id="vipCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <filter id="vipGoldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Golden Resonance Ring */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="url(#vipGoldGrad)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeOpacity="0.7"
          />

          {/* Outer Isometric Cube Faces */}
          {/* Top Face - Metallic Gold */}
          <polygon
            points="50,14 84,34 50,54 16,34"
            fill="url(#vipGoldGrad)"
            fillOpacity="0.95"
            stroke="#FEF3C7"
            strokeWidth="1.2"
          />
          {/* Left Face - Deep Spatial Navy */}
          <polygon
            points="16,34 50,54 50,90 16,70"
            fill="url(#vipNavyGrad)"
            fillOpacity="0.9"
            stroke="#D97706"
            strokeWidth="1.2"
          />
          {/* Right Face - Vibrant Cyan/Sapphire */}
          <polygon
            points="50,54 84,34 84,70 50,90"
            fill="url(#vipCyanGrad)"
            fillOpacity="0.85"
            stroke="#38BDF8"
            strokeWidth="1.2"
          />

          {/* Central 369 Core Nexus */}
          <circle cx="50" cy="54" r="6" fill="#FEF3C7" filter="url(#vipGoldGlow)" />
          <circle cx="50" cy="54" r="3" fill="#D97706" />
        </svg>
      </div>

      {/* Brand Wordmark & Subtitle */}
      {showLabel && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '17px',
                fontWeight: 900,
                letterSpacing: '0.12em',
                color: '#0F172A',
                fontFamily: 'Inter, system-ui, sans-serif',
                textTransform: 'uppercase',
              }}
            >
              CUB<span style={{ color: '#D97706' }}>i</span>O
            </span>
            <span
              style={{
                fontSize: '8.5px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#E0F2FE',
                border: '1px solid #BAE6FD',
                color: '#0369A1',
                fontFamily: 'monospace',
                fontWeight: 800,
                letterSpacing: '0.05em',
              }}
            >
              DIMENSION
            </span>
          </div>
          <span
            style={{
              fontSize: '8px',
              letterSpacing: '0.22em',
              color: '#64748B',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              marginTop: '2px',
            }}
          >
            UNIVERSAL SPATIAL OPERATING ENVIRONMENT
          </span>

        </div>
      )}
    </div>
  );
};
