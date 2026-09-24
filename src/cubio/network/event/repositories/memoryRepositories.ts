/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-15: In-Memory Event & Channel Repository
 */

import {
  ChannelRecord,
  NetworkEvent,
  EventSubscription,
} from '../types';
import { IEventRepository } from './types';

export class MemoryEventRepository implements IEventRepository {
  private channelsById: Map<string, ChannelRecord> = new Map();
  private channelsByUri: Map<string, string> = new Map(); // channelUri -> channelId
  private eventsById: Map<string, NetworkEvent> = new Map();
  private eventsByChannel: Map<string, NetworkEvent[]> = new Map(); // channelId -> events[]
  private subscriptionsById: Map<string, EventSubscription> = new Map();
  private subscriptionsByChannel: Map<string, Set<string>> = new Map(); // channelId -> Set<subscriptionId>

  // --- CHANNELS ---

  public async saveChannel(channel: ChannelRecord): Promise<void> {
    const frozen = Object.freeze({ ...channel });
    this.channelsById.set(channel.channelId, frozen);
    this.channelsByUri.set(channel.channelUri.toLowerCase(), channel.channelId);
  }

  public async getChannel(channelId: string): Promise<ChannelRecord | undefined> {
    return this.channelsById.get(channelId);
  }

  public async getChannelByUri(channelUri: string): Promise<ChannelRecord | undefined> {
    const id = this.channelsByUri.get(channelUri.toLowerCase());
    return id ? this.channelsById.get(id) : undefined;
  }

  public async listChannels(ownerCubId?: string): Promise<readonly ChannelRecord[]> {
    const matches: ChannelRecord[] = [];
    for (const chn of this.channelsById.values()) {
      if (ownerCubId && chn.ownerCubId !== ownerCubId) continue;
      matches.push(chn);
    }
    return Object.freeze(matches);
  }

  public async updateChannel(
    channelId: string,
    updates: Partial<ChannelRecord>
  ): Promise<ChannelRecord | undefined> {
    const existing = this.channelsById.get(channelId);
    if (!existing) return undefined;

    const updated: ChannelRecord = Object.freeze({
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    });

    this.channelsById.set(channelId, updated);
    return updated;
  }

  public async deleteChannel(channelId: string): Promise<boolean> {
    const existing = this.channelsById.get(channelId);
    if (!existing) return false;

    this.channelsByUri.delete(existing.channelUri.toLowerCase());
    this.eventsByChannel.delete(channelId);
    this.subscriptionsByChannel.delete(channelId);
    return this.channelsById.delete(channelId);
  }

  // --- EVENTS ---

  public async saveEvent(event: NetworkEvent): Promise<void> {
    const frozen = Object.freeze({ ...event });
    this.eventsById.set(event.eventId, frozen);

    let channelEvents = this.eventsByChannel.get(event.channelId);
    if (!channelEvents) {
      channelEvents = [];
      this.eventsByChannel.set(event.channelId, channelEvents);
    }
    channelEvents.push(frozen);
  }

  public async getEvent(eventId: string): Promise<NetworkEvent | undefined> {
    return this.eventsById.get(eventId);
  }

  public async getEventsByChannel(
    channelId: string,
    fromSequence: number = 1,
    limit: number = 100
  ): Promise<readonly NetworkEvent[]> {
    const channelEvents = this.eventsByChannel.get(channelId) || [];
    const filtered = channelEvents
      .filter((e) => e.sequenceNumber >= fromSequence)
      .slice(0, limit);
    return Object.freeze(filtered);
  }

  // --- SUBSCRIPTIONS ---

  public async saveSubscription(sub: EventSubscription): Promise<void> {
    const frozen = Object.freeze({ ...sub });
    this.subscriptionsById.set(sub.subscriptionId, frozen);

    let set = this.subscriptionsByChannel.get(sub.channelId);
    if (!set) {
      set = new Set();
      this.subscriptionsByChannel.set(sub.channelId, set);
    }
    set.add(sub.subscriptionId);
  }

  public async getSubscription(subscriptionId: string): Promise<EventSubscription | undefined> {
    return this.subscriptionsById.get(subscriptionId);
  }

  public async getSubscriptionsByChannel(channelId: string): Promise<readonly EventSubscription[]> {
    const set = this.subscriptionsByChannel.get(channelId);
    if (!set) return Object.freeze([]);

    const matches: EventSubscription[] = [];
    for (const subId of set) {
      const sub = this.subscriptionsById.get(subId);
      if (sub && sub.status === 'ACTIVE') {
        matches.push(sub);
      }
    }
    return Object.freeze(matches);
  }

  public async deleteSubscription(subscriptionId: string): Promise<boolean> {
    const sub = this.subscriptionsById.get(subscriptionId);
    if (!sub) return false;

    const set = this.subscriptionsByChannel.get(sub.channelId);
    if (set) {
      set.delete(subscriptionId);
    }
    return this.subscriptionsById.delete(subscriptionId);
  }
}
