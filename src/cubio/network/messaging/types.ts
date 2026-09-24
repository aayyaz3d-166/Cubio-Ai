/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-05: CubiO Communication & Messaging (Types & Models)
 *
 * Formal specification for sovereign communication identity, conversations,
 * peer-to-peer communication, channel broadcasts, and multi-entity messaging.
 *
 * ARCHITECTURAL INVARIANT:
 * - NET-05 messages are sent by and addressed to sovereign CUB-XXXXXXXX identities (NET-01).
 * - Messages route across canonical NET-00 coordinates (CUBIO://NETWORK/...).
 * - Communication modes support:
 *   1. User <-> User
 *   2. User <-> Agent
 *   3. User <-> Service
 *   4. Agent <-> Agent
 *   5. Service <-> Service
 */

import { CubiOEntityType } from '../identity/types';
import { CubiOAccount } from '../account/types';

export type MessageType =
  | 'DIRECT'
  | 'CHANNEL'
  | 'SYSTEM'
  | 'SPATIAL_EVENT'
  | 'RPC'
  | 'AGENT_PROMPT'
  | 'AGENT_RESPONSE'
  | 'SERVICE_REQUEST'
  | 'SERVICE_RESPONSE';

export type MessagePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type MessageDeliveryStatus =
  | 'QUEUED'
  | 'TRANSMITTING'
  | 'DELIVERED'
  | 'READ'
  | 'REVOKED'
  | 'FAILED'
  | 'REJECTED';

export type CommunicationMode =
  | 'USER_USER'
  | 'USER_AGENT'
  | 'USER_SERVICE'
  | 'AGENT_AGENT'
  | 'SERVICE_SERVICE';

export interface CubiOCommunicationIdentity {
  readonly cubId: string; // Sovereign CUB-XXXXXXXX from NET-01
  readonly entityType: CubiOEntityType; // USER | AGENT | SERVICE | DEVICE
  readonly displayName: string;
  readonly coordinateUri: string; // Canonical NET-00 Coordinate
  readonly account?: CubiOAccount; // Optional NET-04 profile
  readonly omailAddress?: string; // username@omail.com
  readonly cubioAddress?: string; // username@cubio.com
  readonly status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  readonly capabilities: readonly string[];
}

export type ConversationType = 'DIRECT' | 'GROUP' | 'AGENT_TASK' | 'SERVICE_STREAM';

export interface CubiOConversation {
  readonly conversationId: string; // CONV_...
  readonly type: ConversationType;
  readonly title?: string;
  readonly communicationMode?: CommunicationMode;
  readonly participantCubIds: readonly string[]; // Sovereign CUB-XXXXXXXX IDs
  readonly participants: readonly CubiOCommunicationIdentity[];
  readonly lastMessageId?: string;
  readonly lastMessageSnippet?: string;
  readonly messageCount: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface CubiOMessage {
  readonly messageId: string; // MSG_...
  readonly conversationId?: string; // CONV_...
  readonly type: MessageType;
  readonly senderCubId: string; // Sovereign CUB-XXXXXXXX
  readonly senderCoordinateUri: string; // NET-00 Canonical URI
  readonly receiverCubId?: string; // Direct recipient sovereign CUB-XXXXXXXX
  readonly recipientCubId?: string; // Alias for receiverCubId
  readonly recipientCoordinateUri: string; // Destination NET-00 Coordinate
  readonly channelId?: string; // Room / Channel identifier for broadcasts
  readonly communicationMode?: CommunicationMode;
  readonly priority: MessagePriority;
  readonly subject?: string;
  readonly content: string;
  readonly metadata?: Readonly<Record<string, any>>;
  readonly payload?: Readonly<Record<string, any>>; // Alias for metadata
  readonly signature?: string; // Cryptographic HMAC / Ed25519 signature
  readonly status: MessageDeliveryStatus;
  readonly traceHops: readonly string[];
  readonly createdAt: number;
  readonly sentAt: number; // Alias for createdAt
  readonly deliveredAt?: number;
  readonly readAt?: number;
  readonly revokedAt?: number;
  readonly failureReason?: string;
}

export interface SendMessageInput {
  readonly recipientCoordinateUri?: string; // Optional if conversationId is provided
  readonly receiverCubId?: string;
  readonly recipientCubId?: string;
  readonly recipientAddress?: string; // @omail.com or @cubio.com address
  readonly conversationId?: string;
  readonly channelId?: string;
  readonly type?: MessageType;
  readonly priority?: MessagePriority;
  readonly subject?: string;
  readonly content: string;
  readonly metadata?: Record<string, any>;
  readonly payload?: Record<string, any>;
}

export interface MessageFilter {
  readonly senderCubId?: string;
  readonly receiverCubId?: string;
  readonly recipientCubId?: string;
  readonly conversationId?: string;
  readonly channelId?: string;
  readonly type?: MessageType;
  readonly status?: MessageDeliveryStatus;
  readonly limit?: number;
  readonly offset?: number;
}

export interface MessagingChannel {
  readonly channelId: string; // CHAN_...
  readonly name: string;
  readonly topic?: string;
  readonly coordinateUri: string; // CUBIO://NETWORK/<dim>/<zone>/<node>/CHAT
  readonly ownerCubId: string;
  readonly members: readonly string[]; // CUB-XXXXXXXX IDs
  readonly isPrivate: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface ChannelCreateInput {
  readonly name: string;
  readonly topic?: string;
  readonly coordinateUri?: string;
  readonly isPrivate?: boolean;
  readonly initialMembers?: readonly string[];
}
