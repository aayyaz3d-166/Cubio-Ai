/**
 * CubiO — Universal Spatial Operating Environment
 * Core Type Definitions
 *
 * Enforces strict namespace isolation, deterministic types, and multi-dimensional state structures.
 */

import { CubiOState } from './state/types';
export type { CubiOState };

export type CubiODimension = 'D0' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7';

export type CubiOCoreStatus = 'ONLINE' | 'STANDBY' | 'SYNCING' | 'RESONATING' | 'DEGRADED';

export type CubiOEngineType =
  | 'STUDIO'
  | 'CORE'
  | 'ENGINE_369'
  | 'STATE'
  | 'DIMENSION'
  | 'MEMORY'
  | 'INTELLIGENCE'
  | 'NETWORK'
  | 'FS'
  | 'RUNTIME';

export interface CubiOStateNode {
  readonly stateId: string;
  readonly dimension: CubiODimension;
  readonly label: string;
  readonly timestamp: number;
  readonly entropy: number;
  readonly resonanceFrequency: number;
  readonly checksum: string;
  readonly status: 'ACTIVE' | 'ARCHIVED' | 'BRANCHED' | 'LOCKED';
  readonly data: Readonly<Record<string, any>>;
}

export interface CubiOMemoryNode {
  readonly memoryId: string;
  readonly key: string;
  readonly type: 'EPISODIC' | 'SPATIAL' | 'HOLOGRAPHIC' | 'SYSTEM';
  readonly dimension: CubiODimension;
  readonly resonanceIndex: number;
  readonly payload: any;
  readonly checksum: string;
  readonly timestamp: number;
}

export interface CubiOHarmonic369 {
  readonly triad: readonly [3, 6, 9];
  readonly vortexState: number;
  readonly harmonicFlux: number;
  readonly phaseShift: number;
  readonly quantumPolarity: number;
  readonly resonanceScore: number;
  readonly activeFrequencyHz: number;
}

export interface CubiOIntelligenceQuery {
  readonly queryId: string;
  readonly prompt: string;
  readonly reasoningSteps: readonly string[];
  readonly inferredConclusion: string;
  readonly confidence: number;
  readonly status: 'RESOLVED' | 'PROCESSING' | 'AMBIGUOUS';
  readonly timestamp: number;
}

export interface CubiONetworkPeer {
  readonly peerId: string;
  readonly nodeName: string;
  readonly address: string;
  readonly latencyMs: number;
  readonly status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCHRONIZING';
  readonly syncedBlocks: number;
}

export interface CubiOFileNode {
  readonly fileId: string;
  readonly cid: string;
  readonly name: string;
  readonly sizeBytes: number;
  readonly dimension: CubiODimension;
  readonly type: 'SPATIAL_OBJECT' | 'STATE_SNAPSHOT' | 'NEURAL_WEIGHT' | 'SYSTEM_CONFIG';
  readonly updatedAt: number;
}

export interface CubiOActivityLogEntry {
  readonly logId: string;
  readonly timestamp: number;
  readonly level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'RESONANCE';
  readonly subsystem: CubiOEngineType;
  readonly message: string;
  readonly details?: string;
}

export interface CubiOSettings {
  readonly theme: 'CYBER_DARK' | 'VOID_OBSIDIAN' | 'NEON_GRID';
  readonly renderQuality: 'HIGH' | 'MEDIUM' | 'PERFORMANCE';
  readonly enableHolographicGrid: boolean;
  readonly autoRotateCube: boolean;
  readonly resonanceFrequencyHz: number;
  readonly activeP2PNetwork: boolean;
}

export interface CubiOStudioState {
  readonly coreStatus: CubiOCoreStatus;
  readonly activeDimension: CubiODimension;
  readonly activeStateId: string;
  readonly states: readonly CubiOState[];
  readonly memories: readonly CubiOMemoryNode[];
  readonly harmonic: CubiOHarmonic369;
  readonly queries: readonly CubiOIntelligenceQuery[];
  readonly peers: readonly CubiONetworkPeer[];
  readonly files: readonly CubiOFileNode[];
  readonly activityLogs: readonly CubiOActivityLogEntry[];
  readonly settings: CubiOSettings;
  readonly selectedCubeFace: number | null;
  readonly activeTabLeft: 'STATES' | 'MEMORY' | '369' | 'DIMENSION' | 'NETWORK' | 'FILES';
  readonly activeTabRight: 'INTELLIGENCE' | 'REASONING' | 'PREDICTION' | 'INSPECTOR';
}
