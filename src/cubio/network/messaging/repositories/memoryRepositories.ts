/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-05: In-Memory Message & Channel Repositories
 */

import { CubiOMessage, MessagingChannel, MessageFilter, MessageDeliveryStatus } from '../types';
import { IMessageRepository, IChannelRepository } from './types';

export class MemoryMessageRepository implements IMessageRepository {
  private messages: Map<string, CubiOMessage> = new Map();

  public async saveMessage(message: CubiOMessage): Promise<void> {
    this.messages.set(message.messageId, Object.freeze({ ...message }));
  }

  public async getMessageById(messageId: string): Promise<CubiOMessage | undefined> {
    return this.messages.get(messageId.trim());
  }

  public async listMessages(filter?: MessageFilter): Promise<readonly CubiOMessage[]> {
    let list = Array.from(this.messages.values());

    if (filter?.senderCubId) {
      list = list.filter((m) => m.senderCubId === filter.senderCubId);
    }
    const targetRecipient = filter?.receiverCubId || filter?.recipientCubId;
    if (targetRecipient) {
      list = list.filter(
        (m) => m.recipientCubId === targetRecipient || m.receiverCubId === targetRecipient
      );
    }
    if (filter?.conversationId) {
      list = list.filter((m) => m.conversationId === filter.conversationId);
    }
    if (filter?.channelId) {
      list = list.filter((m) => m.channelId === filter.channelId);
    }
    if (filter?.type) {
      list = list.filter((m) => m.type === filter.type);
    }
    if (filter?.status) {
      list = list.filter((m) => m.status === filter.status);
    }

    // Sort chronologically ascending
    list.sort((a, b) => a.createdAt - b.createdAt);

    if (filter?.offset !== undefined) {
      list = list.slice(filter.offset);
    }
    if (filter?.limit !== undefined) {
      list = list.slice(0, filter.limit);
    }

    return Object.freeze(list);
  }

  public async updateMessageStatus(
    messageId: string,
    status: MessageDeliveryStatus,
    timestamp = Date.now()
  ): Promise<boolean> {
    const existing = this.messages.get(messageId.trim());
    if (!existing) return false;

    const updated: CubiOMessage = Object.freeze({
      ...existing,
      status,
      deliveredAt: status === 'DELIVERED' ? timestamp : existing.deliveredAt,
      readAt: status === 'READ' ? timestamp : existing.readAt,
      revokedAt: status === 'REVOKED' ? timestamp : existing.revokedAt,
    });

    this.messages.set(existing.messageId, updated);
    return true;
  }

  public async deleteMessage(messageId: string): Promise<boolean> {
    return this.messages.delete(messageId.trim());
  }

  public async clear(): Promise<void> {
    this.messages.clear();
  }
}

export class MemoryChannelRepository implements IChannelRepository {
  private channels: Map<string, MessagingChannel> = new Map();
  private channelsByCoordinate: Map<string, string> = new Map(); // coord -> channelId

  public async saveChannel(channel: MessagingChannel): Promise<void> {
    const frozen = Object.freeze({ ...channel });
    this.channels.set(channel.channelId, frozen);
    this.channelsByCoordinate.set(channel.coordinateUri.toUpperCase(), channel.channelId);
  }

  public async getChannelById(channelId: string): Promise<MessagingChannel | undefined> {
    return this.channels.get(channelId.trim());
  }

  public async getChannelByCoordinate(coordinateUri: string): Promise<MessagingChannel | undefined> {
    const channelId = this.channelsByCoordinate.get(coordinateUri.trim().toUpperCase());
    if (!channelId) return undefined;
    return this.getChannelById(channelId);
  }

  public async listChannels(filter?: {
    ownerCubId?: string;
    memberCubId?: string;
  }): Promise<readonly MessagingChannel[]> {
    let list = Array.from(this.channels.values());

    if (filter?.ownerCubId) {
      list = list.filter((c) => c.ownerCubId === filter.ownerCubId);
    }
    if (filter?.memberCubId) {
      list = list.filter((c) => c.members.includes(filter.memberCubId!));
    }

    return Object.freeze(list);
  }

  public async deleteChannel(channelId: string): Promise<boolean> {
    const existing = this.channels.get(channelId.trim());
    if (!existing) return false;

    this.channels.delete(channelId.trim());
    this.channelsByCoordinate.delete(existing.coordinateUri.toUpperCase());
    return true;
  }

  public async clear(): Promise<void> {
    this.channels.clear();
    this.channelsByCoordinate.clear();
  }
}
