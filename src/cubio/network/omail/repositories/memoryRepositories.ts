/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-07: In-Memory OMail Repository
 */

import {
  OMailMessage,
  OMailThread,
  OMailBox,
  OMailFolderType,
  OMailFlags,
  MailQueryOptions,
} from '../types';
import { IOMailRepository } from './types';

export class MemoryOMailRepository implements IOMailRepository {
  private mailboxes: Map<string, OMailBox> = new Map(); // ownerCubId -> OMailBox
  private messages: Map<string, OMailMessage> = new Map(); // mailId -> OMailMessage
  private threads: Map<string, OMailThread> = new Map(); // `${ownerCubId}:${threadId}` -> OMailThread

  // --- MAILBOX ---

  public async saveMailbox(mailbox: OMailBox): Promise<void> {
    this.mailboxes.set(mailbox.ownerCubId, Object.freeze({ ...mailbox }));
  }

  public async getMailbox(ownerCubId: string): Promise<OMailBox | undefined> {
    return this.mailboxes.get(ownerCubId);
  }

  // --- MESSAGES ---

  public async saveMessage(message: OMailMessage): Promise<void> {
    this.messages.set(message.mailId, Object.freeze({ ...message }));
  }

  public async getMessage(mailId: string): Promise<OMailMessage | undefined> {
    return this.messages.get(mailId);
  }

  public async getMessagesByOwner(
    ownerCubId: string,
    options: MailQueryOptions = {}
  ): Promise<readonly OMailMessage[]> {
    let matches: OMailMessage[] = [];

    for (const msg of this.messages.values()) {
      if (msg.ownerCubId !== ownerCubId) continue;
      if (options.folder && msg.folder !== options.folder) continue;
      if (options.threadId && msg.threadId !== options.threadId) continue;
      if (options.isUnread !== undefined && msg.flags.isRead === options.isUnread) continue;
      if (options.isStarred !== undefined && msg.flags.isStarred !== options.isStarred) continue;

      if (options.searchQuery) {
        const q = options.searchQuery.toLowerCase();
        const inSubj = msg.subject.toLowerCase().includes(q);
        const inBody = msg.body.toLowerCase().includes(q);
        const inSender = msg.senderAddress.toLowerCase().includes(q);
        const inRecipients = msg.recipientAddresses.some((r) => r.toLowerCase().includes(q));
        if (!inSubj && !inBody && !inSender && !inRecipients) continue;
      }

      matches.push(msg);
    }

    // Sort newest first
    matches.sort((a, b) => b.createdAt - a.createdAt);

    if (options.offset) {
      matches = matches.slice(options.offset);
    }
    if (options.limit) {
      matches = matches.slice(0, options.limit);
    }

    return Object.freeze(matches);
  }

  public async getMessagesByThread(
    threadId: string,
    ownerCubId?: string
  ): Promise<readonly OMailMessage[]> {
    const matches: OMailMessage[] = [];
    for (const msg of this.messages.values()) {
      if (msg.threadId === threadId) {
        if (!ownerCubId || msg.ownerCubId === ownerCubId) {
          matches.push(msg);
        }
      }
    }
    // Sort chronologically ascending
    matches.sort((a, b) => a.createdAt - b.createdAt);
    return Object.freeze(matches);
  }

  public async updateMessageFlags(
    mailId: string,
    flags: Partial<OMailFlags>
  ): Promise<OMailMessage | undefined> {
    const existing = this.messages.get(mailId);
    if (!existing) return undefined;

    const updated: OMailMessage = Object.freeze({
      ...existing,
      flags: Object.freeze({
        ...existing.flags,
        ...flags,
      }),
      readAt: flags.isRead && !existing.flags.isRead ? Date.now() : existing.readAt,
      status: flags.isRead ? 'READ' : existing.status,
      updatedAt: Date.now(),
    });

    this.messages.set(mailId, updated);
    return updated;
  }

  public async moveMessage(mailId: string, folder: OMailFolderType): Promise<boolean> {
    const existing = this.messages.get(mailId);
    if (!existing) return false;

    const updated: OMailMessage = Object.freeze({
      ...existing,
      folder,
      status: folder === 'TRASH' ? 'TRASHED' : folder === 'ARCHIVE' ? 'ARCHIVED' : existing.status,
      flags: Object.freeze({
        ...existing.flags,
        isArchived: folder === 'ARCHIVE',
      }),
      updatedAt: Date.now(),
    });

    this.messages.set(mailId, updated);
    return true;
  }

  public async deleteMessage(mailId: string): Promise<boolean> {
    return this.messages.delete(mailId);
  }

  // --- THREADS ---

  public async saveThread(thread: OMailThread): Promise<void> {
    const key = `${thread.ownerCubId}:${thread.threadId}`;
    this.threads.set(key, Object.freeze({ ...thread }));
  }

  public async getThread(threadId: string, ownerCubId?: string): Promise<OMailThread | undefined> {
    if (ownerCubId) {
      return this.threads.get(`${ownerCubId}:${threadId}`);
    }
    for (const thread of this.threads.values()) {
      if (thread.threadId === threadId) {
        return thread;
      }
    }
    return undefined;
  }

  public async getThreadsByOwner(
    ownerCubId: string,
    options: MailQueryOptions = {}
  ): Promise<readonly OMailThread[]> {
    let matches: OMailThread[] = [];

    for (const [key, thread] of this.threads.entries()) {
      if (key.startsWith(`${ownerCubId}:`)) {
        if (options.isUnread !== undefined && thread.isUnread !== options.isUnread) continue;
        matches.push(thread);
      }
    }

    // Sort newest activity first
    matches.sort((a, b) => b.lastActivityAt - a.lastActivityAt);

    if (options.offset) {
      matches = matches.slice(options.offset);
    }
    if (options.limit) {
      matches = matches.slice(0, options.limit);
    }

    return Object.freeze(matches);
  }

  public async deleteThread(threadId: string, ownerCubId: string): Promise<boolean> {
    return this.threads.delete(`${ownerCubId}:${threadId}`);
  }
}
