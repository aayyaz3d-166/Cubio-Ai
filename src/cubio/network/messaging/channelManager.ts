/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-05: Messaging Channel & Group Manager
 *
 * Manages chat channels, spatial rooms, and multi-party communication groups.
 */

import { deterministicHash } from '../../state/determinism';
import { MessagingChannel, ChannelCreateInput } from './types';
import { IChannelRepository } from './repositories/types';
import { MemoryChannelRepository } from './repositories/memoryRepositories';

export class CubiOChannelManager {
  private repository: IChannelRepository;

  constructor(repository?: IChannelRepository) {
    this.repository = repository || new MemoryChannelRepository();
  }

  public getRepository(): IChannelRepository {
    return this.repository;
  }

  /**
   * Creates a new messaging channel bound to a network coordinate.
   */
  public async createChannel(
    ownerCubId: string,
    input: ChannelCreateInput
  ): Promise<Readonly<MessagingChannel>> {
    const cleanOwner = ownerCubId.trim();
    const now = Date.now();
    const channelId = `CHAN_${deterministicHash(`${cleanOwner}:${input.name}:${now}`).slice(2, 18)}`;

    const coordinateUri =
      input.coordinateUri ||
      `CUBIO://NETWORK/0/01/${String(Math.abs(parseInt(deterministicHash(channelId).slice(2, 8), 16) % 99999)).padStart(5, '0')}/CHAT`;

    const members = Array.from(new Set([cleanOwner, ...(input.initialMembers || [])]));

    const channel: MessagingChannel = Object.freeze({
      channelId,
      name: input.name.trim(),
      topic: input.topic,
      coordinateUri,
      ownerCubId: cleanOwner,
      members: Object.freeze(members),
      isPrivate: !!input.isPrivate,
      createdAt: now,
      updatedAt: now,
    });

    await this.repository.saveChannel(channel);
    return channel;
  }

  /**
   * Retrieves a channel by ID.
   */
  public async getChannel(channelId: string): Promise<Readonly<MessagingChannel> | undefined> {
    return this.repository.getChannelById(channelId);
  }

  /**
   * Retrieves a channel by coordinate URI.
   */
  public async getChannelByCoordinate(coordinateUri: string): Promise<Readonly<MessagingChannel> | undefined> {
    return this.repository.getChannelByCoordinate(coordinateUri);
  }

  /**
   * Adds a member to a channel.
   */
  public async joinChannel(channelId: string, cubId: string): Promise<Readonly<MessagingChannel>> {
    const existing = await this.getChannel(channelId);
    if (!existing) {
      throw new Error(`Channel '${channelId}' not found.`);
    }

    const cleanCubId = cubId.trim();
    if (existing.members.includes(cleanCubId)) {
      return existing;
    }

    const updated: MessagingChannel = Object.freeze({
      ...existing,
      members: Object.freeze([...existing.members, cleanCubId]),
      updatedAt: Date.now(),
    });

    await this.repository.saveChannel(updated);
    return updated;
  }

  /**
   * Removes a member from a channel.
   */
  public async leaveChannel(channelId: string, cubId: string): Promise<Readonly<MessagingChannel>> {
    const existing = await this.getChannel(channelId);
    if (!existing) {
      throw new Error(`Channel '${channelId}' not found.`);
    }

    const cleanCubId = cubId.trim();
    const updated: MessagingChannel = Object.freeze({
      ...existing,
      members: Object.freeze(existing.members.filter((m) => m !== cleanCubId)),
      updatedAt: Date.now(),
    });

    await this.repository.saveChannel(updated);
    return updated;
  }

  /**
   * Lists channels with optional filtering.
   */
  public async listChannels(filter?: {
    ownerCubId?: string;
    memberCubId?: string;
  }): Promise<readonly MessagingChannel[]> {
    return this.repository.listChannels(filter);
  }
}
