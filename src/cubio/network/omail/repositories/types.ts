/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-07: OMail Repository Interfaces
 */

import {
  OMailMessage,
  OMailThread,
  OMailBox,
  OMailFolderType,
  OMailFlags,
  MailQueryOptions,
} from '../types';

export interface IOMailRepository {
  // Mailbox
  saveMailbox(mailbox: OMailBox): Promise<void>;
  getMailbox(ownerCubId: string): Promise<OMailBox | undefined>;

  // Messages
  saveMessage(message: OMailMessage): Promise<void>;
  getMessage(mailId: string): Promise<OMailMessage | undefined>;
  getMessagesByOwner(ownerCubId: string, options?: MailQueryOptions): Promise<readonly OMailMessage[]>;
  getMessagesByThread(threadId: string, ownerCubId?: string): Promise<readonly OMailMessage[]>;
  updateMessageFlags(mailId: string, flags: Partial<OMailFlags>): Promise<OMailMessage | undefined>;
  moveMessage(mailId: string, folder: OMailFolderType): Promise<boolean>;
  deleteMessage(mailId: string): Promise<boolean>;

  // Threads
  saveThread(thread: OMailThread): Promise<void>;
  getThread(threadId: string, ownerCubId?: string): Promise<OMailThread | undefined>;
  getThreadsByOwner(ownerCubId: string, options?: MailQueryOptions): Promise<readonly OMailThread[]>;
  deleteThread(threadId: string, ownerCubId: string): Promise<boolean>;
}
