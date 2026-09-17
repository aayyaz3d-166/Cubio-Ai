/**
 * CubiO — Universal Spatial Operating Environment
 * Dedicated CUBiO Networking Workspace Component (/cubio/network)
 */

import React, { useState } from 'react';
import {
  Network,
  Users,
  Brain,
  ShieldCheck,
  ChevronLeft,
  Radio,
  Share2,
  Server,
  Activity,
  PlusCircle,
  MessageSquare,
} from 'lucide-react';

export interface CubiONetworkAppProps {
  readonly onExitToCore?: () => void;
  readonly onExitToIntelligence?: () => void;
}

export const CubiONetworkApp: React.FC<CubiONetworkAppProps> = ({
  onExitToCore,
  onExitToIntelligence,
}) => {
  const peers = [
    { id: 'PEER_LOCAL_ALICE', name: 'Alice (Core Admin)', type: 'HUMAN', status: 'ONLINE', latency: '0ms' },
    { id: 'PEER_AI_SAGE', name: 'Sage (Autonomous AI Agent)', type: 'AI_AGENT', status: 'ONLINE', latency: '2ms' },
    { id: 'PEER_REMOTE_NODE_03', name: 'Hypercube Cluster US-East', type: 'COMPUTE_NODE', status: 'SYNCED', latency: '18ms' },
  ];

  const spaces = [
    { id: 'SPACE_GENESIS_CORE', name: 'Genesis Spatial Room', members: 3, states: 128512, active: true },
    { id: 'SPACE_RESEARCH_D7', name: 'D7 Manifold Collab', members: 2, states: 4200, active: false },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#040711',
        color: '#F8FAFC',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* 1. TOP HEADER */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          padding: '0 20px',
          backgroundColor: '#070D1A',
          borderBottom: '1px solid #131E35',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onExitToCore}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: '#0B1325',
              border: '1px solid #1E293B',
              color: '#94A3B8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>CubiO Core</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                backgroundColor: '#0F172A',
                border: '1px solid #6366F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Network className="w-4 h-4 text-indigo-400" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#F8FAFC' }}>
              CUB<span style={{ color: '#6366F1' }}>i</span>O Networking
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onExitToIntelligence}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 11px',
              borderRadius: '6px',
              backgroundColor: 'rgba(217, 119, 6, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#FDE68A',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>Intelligence</span>
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div style={{ backgroundColor: '#070D1A', border: '1px solid #131E35', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>P2P MESH STATUS</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>ONLINE & SYNCED</div>
              <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>Vector Clocks Invariant (0 divergence)</div>
            </div>

            <div style={{ backgroundColor: '#070D1A', border: '1px solid #131E35', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>CONNECTED PEERS</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>3 ACTIVE</div>
              <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>1 Human + 1 AI Peer + 1 Node</div>
            </div>

            <div style={{ backgroundColor: '#070D1A', border: '1px solid #131E35', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>SHARED SPACES</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#FDE68A', marginTop: '4px' }}>2 ROOMS</div>
              <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>Realtime CRDT State Mutation</div>
            </div>
          </div>

          {/* Connected Peers List */}
          <div style={{ backgroundColor: '#070D1A', border: '1px solid #131E35', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC', marginBottom: '14px' }}>
              REGISTERED P2P PEERS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {peers.map((peer) => (
                <div
                  key={peer.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#0B1325',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC' }}>{peer.name}</div>
                      <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>{peer.id}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '10px', color: '#38BDF8', fontFamily: 'monospace' }}>{peer.latency}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#064E3B', color: '#6EE7B7', fontWeight: 800 }}>
                      {peer.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
