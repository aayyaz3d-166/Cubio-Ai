/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 10: CubiO Network Engine Types
 *
 * Distributed Spatial Network Architecture:
 * User -> Network -> Identity -> State Sync -> Shared Spaces -> Communication -> AI Services.
 *
 * Invariant: Deterministic state convergence, cryptographic identity, and permissioned collaboration.
 */

import { CubiODimension } from '../types';
import { CubiOState } from '../state/types';

export type NetworkPeerStatus = 'ONLINE' | 'SYNCING' | 'IDLE' | 'DISCONNECTED';
export type NetworkConnectionState = 'CONNECTED' | 'HANDSHAKE' | 'DISCONNECTED';
export type NetworkChannelType = 'WEBRTC_MESH' | 'WEBSOCKET_HUB' | 'DIRECT_VIRTUAL';

export interface NetworkUserNode {
  readonly userId: string;
  readonly peerId: string;
  readonly displayName: string;
  readonly role: 'OWNER' | 'ADMIN' | 'CONTRIBUTOR' | 'OBSERVER' | 'AI_AGENT';
  readonly publicKey: string;
  readonly status: NetworkPeerStatus;
  readonly latencyMs: number;
  readonly bandwidthBps: number;
  readonly connectedAt: number;
}

export interface NetworkConnection {
  readonly connectionId: string;
  readonly localPeerId: string;
  readonly remotePeerId: string;
  readonly state: NetworkConnectionState;
  readonly channelType: NetworkChannelType;
  readonly rttMs: number;
  readonly bytesSent: number;
  readonly bytesReceived: number;
  readonly establishedAt: number;
}

export type NetworkMessageType =
  | 'STATE_DELTA'
  | 'CHAT_MESSAGE'
  | 'SPATIAL_EVENT'
  | 'AI_RPC_REQUEST'
  | 'AI_RPC_RESPONSE'
  | 'FILE_CHUNK_ANNOUNCE'
  | 'PERMISSION_UPDATE';

export interface NetworkMessage<T = any> {
  readonly messageId: string;
  readonly senderPeerId: string;
  readonly targetChannelOrPeer: string; // Peer ID or Channel Topic (e.g. "space:SPACE_001")
  readonly type: NetworkMessageType;
  readonly payload: T;
  readonly timestamp: number;
  readonly signature: string;
}

export interface SpacePermissions {
  readonly ownerId: string;
  readonly allowedActors: readonly string[]; // User IDs or '*'
  readonly canMutateState: readonly string[];
  readonly canInvite: readonly string[];
  readonly canInvokeAI: readonly string[];
}

export interface SharedCubiOSpace {
  readonly spaceId: string;
  readonly spaceName: string;
  readonly dimension: CubiODimension;
  readonly ownerPeerId: string;
  readonly participantPeerIds: readonly string[];
  readonly permissions: SpacePermissions;
  readonly activeStates: readonly CubiOState[];
  readonly harmonicTuningHz: number;
  readonly vectorClock: Readonly<Record<string, number>>; // peerId -> sequence
  readonly spaceChecksum: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface StateSyncDelta {
  readonly deltaId: string;
  readonly spaceId: string;
  readonly stateId: string;
  readonly updatedPosition?: readonly number[];
  readonly updatedProperties?: Readonly<Record<string, any>>;
  readonly targetDimension?: CubiODimension;
  readonly originPeerId: string;
  readonly sequenceNumber: number;
  readonly timestamp: number;
  readonly deltaChecksum: string;
}

export interface NetworkFileTransfer {
  readonly transferId: string;
  readonly cid: string;
  readonly fileName: string;
  readonly fileSizeBytes: number;
  readonly senderPeerId: string;
  readonly receiverPeerId: string;
  readonly transferredBytes: number;
  readonly chunkIndex: number;
  readonly totalChunks: number;
  readonly status: 'PENDING' | 'TRANSFERRING' | 'COMPLETED' | 'VERIFIED' | 'FAILED';
  readonly transferChecksum: string;
}

export interface NetworkAIAgentPeer {
  readonly agentId: string;
  readonly agentName: string;
  readonly role: 'REASONING_AGENT' | 'PREDICTION_BOT' | 'SPATIAL_CO_PILOT';
  readonly assignedSpaceIds: readonly string[];
  readonly isAutonomous: boolean;
  readonly supportedModalities: readonly string[];
  readonly status: 'ACTIVE' | 'PROCESSING' | 'STANDBY';
}

export interface NetworkStats {
  readonly localPeerId: string;
  readonly connectedPeersCount: number;
  readonly activeSharedSpacesCount: number;
  readonly totalMessagesSent: number;
  readonly totalMessagesReceived: number;
  readonly stateSyncEventsCount: number;
  readonly networkHealthScore: number; // [0..100]
}
