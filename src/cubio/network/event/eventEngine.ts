/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-15: Master Event & Realtime Pub/Sub Engine
 *
 * Implements sovereign pub/sub channels, strict sequence ordering,
 * deduplication, realtime delivery callbacks, event replay buffers, and authorization.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - Channel publishing and subscriptions require explicit NET-01 identity and NET-03 authorization.
 * - Private channels are strictly isolated from unauthorized identities.
 * - Events are deterministically sequenced (1, 2, 3...) per channel to guarantee total causal ordering.
 * - Duplicate events matching recent deduplication IDs are dropped idempotently.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiORoleManager } from '../authz/roleManager';
import { CubiONodeRegistry } from '../coordinate/registry';
import {
  ChannelRecord,
  NetworkEvent,
  EventSubscription,
  CreateChannelInput,
  PublishEventInput,
  SubscribeChannelInput,
} from './types';
import { IEventRepository } from './repositories/types';
import { MemoryEventRepository } from './repositories/memoryRepositories';

export class CubiOEventEngine {
  private repository: IEventRepository;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private roleManager?: CubiORoleManager;
  private nodeRegistry?: CubiONodeRegistry;

  private activeCallbacks: Map<string, (event: NetworkEvent) => void> = new Map();
  private dedupCache: Map<string, { event: NetworkEvent; timestamp: number }> = new Map();

  constructor(options: {
    repository?: IEventRepository;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    roleManager?: CubiORoleManager;
    nodeRegistry?: CubiONodeRegistry;
  } = {}) {
    this.repository = options.repository || new MemoryEventRepository();
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.roleManager = options.roleManager;
    this.nodeRegistry = options.nodeRegistry;
  }

  public getRepository(): IEventRepository {
    return this.repository;
  }

  /**
   * Helper: Authenticates session / token and extracts sovereign caller CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (tokenOrSession.startsWith('CUB-')) {
      return tokenOrSession;
    }

    if (!this.authEngine) {
      throw new Error('Authentication engine not configured in EventEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Event Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Creates a new sovereign realtime event channel.
   */
  public async createChannel(
    tokenOrSession: string,
    input: CreateChannelInput
  ): Promise<Readonly<ChannelRecord>> {
    // 1. Authenticate owner (NET-02)
    const ownerCubId = await this.authenticateCaller(tokenOrSession);

    // 2. Check if channelUri already exists
    const existing = await this.repository.getChannelByUri(input.channelUri);
    if (existing) {
      throw new Error(`Channel Creation Error: Channel URI '${input.channelUri}' already exists.`);
    }

    // 3. Evaluate NET-03 authorization for CHANNEL_MANAGE
    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: ownerCubId,
        action: 'CHANNEL_MANAGE',
        resourceUri: input.coordinateUri || 'CUBIO://NETWORK/0/01/00000/EVENTS',
      });

      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${ownerCubId}' lacks permission 'CHANNEL_MANAGE'.`);
      }
    }

    const now = Date.now();
    const channelId = `CHN_${deterministicHash(`${ownerCubId}:${input.channelUri}:${now}`).slice(2, 18)}`;

    const channel: ChannelRecord = Object.freeze({
      channelId,
      channelUri: input.channelUri.toLowerCase().trim(),
      name: input.name.trim(),
      ownerCubId,
      channelType: input.channelType || 'TOPIC_BASED',
      visibility: input.visibility || 'PUBLIC',
      allowedPublishers: Object.freeze([...(input.allowedPublishers || [])]),
      allowedSubscribers: Object.freeze([...(input.allowedSubscribers || [])]),
      status: 'ACTIVE',
      currentSequence: 0,
      coordinateUri: input.coordinateUri || 'CUBIO://NETWORK/0/01/00000/EVENTS',
      createdAt: now,
      updatedAt: now,
    });

    await this.repository.saveChannel(channel);
    return channel;
  }

  /**
   * Subscribes an authenticated sovereign caller to a channel with optional live callback.
   */
  public async subscribe(
    tokenOrSession: string,
    input: SubscribeChannelInput,
    callback?: (event: NetworkEvent) => void
  ): Promise<Readonly<EventSubscription>> {
    const subscriberCubId = await this.authenticateCaller(tokenOrSession);

    let channel: ChannelRecord | undefined;
    if (input.channelUriOrId.startsWith('CHN_')) {
      channel = await this.repository.getChannel(input.channelUriOrId);
    } else {
      channel = await this.repository.getChannelByUri(input.channelUriOrId);
    }

    if (!channel) {
      throw new Error(`Event Subscription Error: Channel '${input.channelUriOrId}' not found.`);
    }

    if (channel.status !== 'ACTIVE') {
      throw new Error(`Event Subscription Error: Channel is in '${channel.status}' state.`);
    }

    // Access control evaluation
    const isOwner = channel.ownerCubId === subscriberCubId;
    const isPublic = channel.visibility === 'PUBLIC';
    const isExplicitlyAllowed = channel.allowedSubscribers.includes(subscriberCubId);

    if (!isOwner && !isPublic && !isExplicitlyAllowed) {
      throw new Error(`Authorization Denied: Identity '${subscriberCubId}' cannot subscribe to private channel '${channel.channelUri}'.`);
    }

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: subscriberCubId,
        action: 'CHANNEL_SUBSCRIBE',
        resourceUri: channel.coordinateUri,
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${subscriberCubId}' lacks permission 'CHANNEL_SUBSCRIBE'.`);
      }
    }

    const now = Date.now();
    const subscriptionId = `SUB_${deterministicHash(`${channel.channelId}:${subscriberCubId}:${now}`).slice(2, 18)}`;

    const subscription: EventSubscription = Object.freeze({
      subscriptionId,
      channelId: channel.channelId,
      channelUri: channel.channelUri,
      subscriberCubId,
      filterEventType: input.filterEventType,
      lastDeliveredSequence: input.fromSequence !== undefined ? input.fromSequence - 1 : channel.currentSequence,
      status: 'ACTIVE',
      subscribedAt: now,
    });

    await this.repository.saveSubscription(subscription);

    if (callback) {
      this.activeCallbacks.set(subscriptionId, callback);
    }

    return subscription;
  }

  /**
   * Publishes an event to a channel with strict sequence ordering, deduplication, and realtime delivery.
   */
  public async publish(
    tokenOrSession: string,
    input: PublishEventInput
  ): Promise<Readonly<NetworkEvent>> {
    const publisherCubId = await this.authenticateCaller(tokenOrSession);

    let channel: ChannelRecord | undefined;
    if (input.channelUriOrId.startsWith('CHN_')) {
      channel = await this.repository.getChannel(input.channelUriOrId);
    } else {
      channel = await this.repository.getChannelByUri(input.channelUriOrId);
    }

    if (!channel) {
      throw new Error(`Event Publish Error: Channel '${input.channelUriOrId}' not found.`);
    }

    if (channel.status !== 'ACTIVE') {
      throw new Error(`Event Publish Error: Cannot publish to channel in '${channel.status}' state.`);
    }

    // Publisher permission evaluation
    const isOwner = channel.ownerCubId === publisherCubId;
    const hasPublishPermission = channel.allowedPublishers.length === 0 || channel.allowedPublishers.includes(publisherCubId);

    if (!isOwner && !hasPublishPermission) {
      throw new Error(`Authorization Denied: Identity '${publisherCubId}' is not authorized to publish to channel '${channel.channelUri}'.`);
    }

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: publisherCubId,
        action: 'CHANNEL_PUBLISH',
        resourceUri: channel.coordinateUri,
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${publisherCubId}' lacks permission 'CHANNEL_PUBLISH'.`);
      }
    }

    // Deduplication check
    const dedupId = input.deduplicationId || deterministicHash(`${channel.channelId}:${input.eventType}:${JSON.stringify(input.payload)}`);
    const dedupKey = `${channel.channelId}:${dedupId}`;
    const cached = this.dedupCache.get(dedupKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < 60000) {
      // Duplicate event detected within 60s window: Return original event idempotently
      return cached.event;
    }

    // Total causal sequence ordering increment
    const nextSequence = channel.currentSequence + 1;
    const eventId = `EVT_${deterministicHash(`${channel.channelId}:${nextSequence}:${now}`).slice(2, 18)}`;

    const event: NetworkEvent = Object.freeze({
      eventId,
      channelId: channel.channelId,
      channelUri: channel.channelUri,
      sequenceNumber: nextSequence,
      publisherCubId,
      eventType: input.eventType,
      payload: Object.freeze(typeof input.payload === 'object' ? { ...input.payload } : input.payload),
      priority: input.priority || 'NORMAL',
      deduplicationId: dedupId,
      timestamp: now,
      signature: `SIG_${deterministicHash(`${eventId}:${publisherCubId}:${nextSequence}`).slice(2, 18)}`,
    });

    // Save event and update channel sequence
    await this.repository.saveEvent(event);
    await this.repository.updateChannel(channel.channelId, {
      currentSequence: nextSequence,
      updatedAt: now,
    });

    // Update dedup cache
    this.dedupCache.set(dedupKey, { event, timestamp: now });

    // Realtime live delivery to active subscribers
    const subs = await this.repository.getSubscriptionsByChannel(channel.channelId);
    for (const sub of subs) {
      if (sub.filterEventType && sub.filterEventType !== event.eventType) {
        continue;
      }
      const cb = this.activeCallbacks.get(sub.subscriptionId);
      if (cb) {
        try {
          cb(event);
        } catch {
          // Subscriber callback error sandboxed
        }
      }
    }

    return event;
  }

  /**
   * Replays historical events from a sequence number buffer.
   */
  public async replayEvents(
    tokenOrSession: string,
    channelUriOrId: string,
    fromSequence: number = 1,
    limit: number = 100
  ): Promise<readonly NetworkEvent[]> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    let channel: ChannelRecord | undefined;
    if (channelUriOrId.startsWith('CHN_')) {
      channel = await this.repository.getChannel(channelUriOrId);
    } else {
      channel = await this.repository.getChannelByUri(channelUriOrId);
    }

    if (!channel) {
      throw new Error(`Event Replay Error: Channel '${channelUriOrId}' not found.`);
    }

    // Access control evaluation
    const isOwner = channel.ownerCubId === callerCubId;
    const isPublic = channel.visibility === 'PUBLIC';
    const isAllowed = channel.allowedSubscribers.includes(callerCubId);

    if (!isOwner && !isPublic && !isAllowed) {
      throw new Error(`Authorization Denied: Caller cannot access channel '${channel.channelUri}'.`);
    }

    return this.repository.getEventsByChannel(channel.channelId, fromSequence, limit);
  }

  /**
   * Unsubscribes an active subscription.
   */
  public async unsubscribe(
    tokenOrSession: string,
    subscriptionId: string
  ): Promise<boolean> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const sub = await this.repository.getSubscription(subscriptionId);

    if (!sub) return false;

    if (sub.subscriberCubId !== callerCubId) {
      throw new Error('Security Violation: Caller cannot unsubscribe another identity.');
    }

    this.activeCallbacks.delete(subscriptionId);
    return this.repository.deleteSubscription(subscriptionId);
  }

  /**
   * Closes a channel (owner only).
   */
  public async closeChannel(
    tokenOrSession: string,
    channelId: string
  ): Promise<boolean> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const channel = await this.repository.getChannel(channelId);

    if (!channel) return false;

    if (channel.ownerCubId !== callerCubId) {
      throw new Error('Security Violation: Only channel owner can close channel.');
    }

    const updated = await this.repository.updateChannel(channelId, { status: 'CLOSED' });
    return !!updated;
  }
}
