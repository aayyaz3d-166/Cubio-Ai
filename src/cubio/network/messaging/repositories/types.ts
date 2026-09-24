/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-05: Message and Channel Repository Interfaces
 */

import { CubiOMessage, MessagingChannel, MessageFilter, MessageDeliveryStatus } from '../types';

export interface IMessageRepository {
  saveMessage(message: CubiOMessage): Promise<void>;
  getMessageById(messageId: string): Promise<CubiOMessage | undefined>;
  listMessages(filter?: MessageFilter): Promise<readonly CubiOMessage[]>;
  updateMessageStatus(
    messageId: string,
    status: MessageDeliveryStatus,
    timestamp?: number
  ): Promise<boolean>;
  deleteMessage(messageId: string): Promise<boolean>;
  clear(): Promise<void>;
}

export interface IChannelRepository {
  saveChannel(channel: MessagingChannel): Promise<void>;
  getChannelById(channelId: string): Promise<MessagingChannel | undefined>;
  getChannelByCoordinate(coordinateUri: string): Promise<MessagingChannel | undefined>;
  listChannels(filter?: { ownerCubId?: string; memberCubId?: string }): Promise<readonly MessagingChannel[]>;
  deleteChannel(channelId: string): Promise<boolean>;
  clear(): Promise<void>;
}
