/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-15: CubiO Event / Realtime Network (Types & Models)
 *
 * Formal specification for sovereign pub/sub channels, strict sequence ordering,
 * deduplication, realtime delivery callbacks, event replay buffers, and authorization.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - Channel publishing and subscriptions require explicit NET-01 identity and NET-03 authorization.
 * - Private channels are strictly isolated from unauthorized identities.
 * - Events are deterministically sequenced (1, 2, 3...) per channel to guarantee total causal ordering.
 * - Duplicate events matching recent deduplication IDs are dropped idempotently.
 */

export type ChannelType = 'BROADCAST' | 'UNICAST' | 'MULTICAST' | 'TOPIC_BASED';

export type ChannelVisibility = 'PRIVATE' | 'SHARED' | 'PUBLIC';

export type ChannelStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';

export type EventPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface ChannelRecord {
  readonly channelId: string; // CHN_...
  readonly channelUri: string; // e.g. "events://spatial/physics/mesh-01"
  readonly name: string;
  readonly ownerCubId: string; // Sovereign owner CUB-XXXXXXXX
  readonly channelType: ChannelType;
  readonly visibility: ChannelVisibility;
  readonly allowedPublishers: readonly string[]; // Allowed CUB-XXXXXXXX identities
  readonly allowedSubscribers: readonly string[]; // Allowed CUB-XXXXXXXX identities
  readonly status: ChannelStatus;
  readonly currentSequence: number;
  readonly coordinateUri: string; // CNC coordinate: CUBIO://NETWORK/0/01/00000/EVENTS
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface NetworkEvent {
  readonly eventId: string; // EVT_...
  readonly channelId: string;
  readonly channelUri: string;
  readonly sequenceNumber: number;
  readonly publisherCubId: string; // Sovereign publisher CUB-XXXXXXXX
  readonly eventType: string; // e.g. "TRANSFORM_UPDATE", "COLLISION_EVENT"
  readonly payload: any;
  readonly priority: EventPriority;
  readonly deduplicationId: string;
  readonly timestamp: number;
  readonly signature?: string;
}

export interface EventSubscription {
  readonly subscriptionId: string; // SUB_...
  readonly channelId: string;
  readonly channelUri: string;
  readonly subscriberCubId: string;
  readonly filterEventType?: string;
  readonly lastDeliveredSequence: number;
  readonly status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  readonly subscribedAt: number;
}

export interface CreateChannelInput {
  readonly channelUri: string;
  readonly name: string;
  readonly channelType?: ChannelType; // default: "TOPIC_BASED"
  readonly visibility?: ChannelVisibility; // default: "PUBLIC"
  readonly allowedPublishers?: readonly string[];
  readonly allowedSubscribers?: readonly string[];
  readonly coordinateUri?: string;
}

export interface PublishEventInput {
  readonly channelUriOrId: string;
  readonly eventType: string;
  readonly payload: any;
  readonly priority?: EventPriority; // default: "NORMAL"
  readonly deduplicationId?: string;
}

export interface SubscribeChannelInput {
  readonly channelUriOrId: string;
  readonly filterEventType?: string;
  readonly fromSequence?: number;
}
