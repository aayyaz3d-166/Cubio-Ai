/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-15: Event Repository Interfaces
 */

import {
  ChannelRecord,
  NetworkEvent,
  EventSubscription,
} from '../types';

export interface IEventRepository {
  // Channels
  saveChannel(channel: ChannelRecord): Promise<void>;
  getChannel(channelId: string): Promise<ChannelRecord | undefined>;
  getChannelByUri(channelUri: string): Promise<ChannelRecord | undefined>;
  listChannels(ownerCubId?: string): Promise<readonly ChannelRecord[]>;
  updateChannel(channelId: string, updates: Partial<ChannelRecord>): Promise<ChannelRecord | undefined>;
  deleteChannel(channelId: string): Promise<boolean>;

  // Events
  saveEvent(event: NetworkEvent): Promise<void>;
  getEvent(eventId: string): Promise<NetworkEvent | undefined>;
  getEventsByChannel(channelId: string, fromSequence?: number, limit?: number): Promise<readonly NetworkEvent[]>;

  // Subscriptions
  saveSubscription(sub: EventSubscription): Promise<void>;
  getSubscription(subscriptionId: string): Promise<EventSubscription | undefined>;
  getSubscriptionsByChannel(channelId: string): Promise<readonly EventSubscription[]>;
  deleteSubscription(subscriptionId: string): Promise<boolean>;
}
