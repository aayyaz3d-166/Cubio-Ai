/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-07: Sovereign OMail Email Engine
 *
 * Implements full sovereign email workflows:
 * - Anti-spoofing sender verification against NET-01 / Address Registry
 * - Recipient resolution across @omail.com and @cubio.com
 * - Seamless NET-06 CAS Storage attachment linking
 * - Sovereign mailboxes, folders, threading, and delivery state lifecycles
 * - NET-05 underlying P2P message delivery and notifications
 * - Standard CNC Mail Node: CUBIO://NETWORK/0/01/00002/MAIL
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiOAccountService } from '../account/accountService';
import { CubiOMessagingEngine } from '../messaging/messagingEngine';
import { CubiOAddressRegistry } from '../address/addressRegistry';
import { CubiOStorageEngine } from '../storage/storageEngine';
import {
  OMailMessage,
  OMailThread,
  OMailBox,
  OMailAttachment,
  OMailFolderType,
  SendMailInput,
  SaveDraftInput,
  MailQueryOptions,
  OMailThreadView,
} from './types';
import { IOMailRepository } from './repositories/types';
import { MemoryOMailRepository } from './repositories/memoryRepositories';

export const STANDARD_MAIL_COORDINATE = 'CUBIO://NETWORK/0/01/00002/MAIL';

export class CubiOOMailEngine {
  private repository: IOMailRepository;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private accountService?: CubiOAccountService;
  private messagingEngine?: CubiOMessagingEngine;
  private storageEngine?: CubiOStorageEngine;
  private addressRegistry?: CubiOAddressRegistry;

  constructor(options: {
    repository?: IOMailRepository;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    accountService?: CubiOAccountService;
    messagingEngine?: CubiOMessagingEngine;
    storageEngine?: CubiOStorageEngine;
    addressRegistry?: CubiOAddressRegistry;
  } = {}) {
    this.repository = options.repository || new MemoryOMailRepository();
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.accountService = options.accountService;
    this.messagingEngine = options.messagingEngine;
    this.storageEngine = options.storageEngine;
    this.addressRegistry = options.addressRegistry;
  }

  public getRepository(): IOMailRepository {
    return this.repository;
  }

  /**
   * Authenticates caller and returns sovereign CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (!this.authEngine) {
      if (tokenOrSession.startsWith('CUB-')) {
        return tokenOrSession;
      }
      throw new Error('Authentication engine not configured in OMailEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`OMail Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Retrieves or initializes the mailbox for a sovereign identity.
   */
  public async getOrCreateMailbox(tokenOrSession: string): Promise<Readonly<OMailBox>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    let mailbox = await this.repository.getMailbox(callerCubId);

    if (!mailbox) {
      // Determine primary address
      let primaryAddress = `${callerCubId.toLowerCase()}@omail.com`;
      if (this.addressRegistry) {
        const addresses = await this.addressRegistry.getAddressesForIdentity(callerCubId);
        if (addresses.length > 0) {
          primaryAddress = addresses[0].fullAddress;
        }
      }

      const defaultSummary = { count: 0, unreadCount: 0 };
      const now = Date.now();
      const mailboxId = `MBX_${deterministicHash(`MAILBOX:${callerCubId}`).slice(2, 18)}`;

      mailbox = Object.freeze({
        mailboxId,
        ownerCubId: callerCubId,
        primaryAddress,
        folders: Object.freeze({
          INBOX: defaultSummary,
          SENT: defaultSummary,
          DRAFTS: defaultSummary,
          STARRED: defaultSummary,
          ARCHIVE: defaultSummary,
          TRASH: defaultSummary,
          SPAM: defaultSummary,
        }),
        unreadCount: 0,
        totalMessageCount: 0,
        quotaBytes: 1024 * 1024 * 1024, // 1 GB default mail quota
        usedBytes: 0,
        coordinateUri: STANDARD_MAIL_COORDINATE,
        createdAt: now,
        updatedAt: now,
      });

      await this.repository.saveMailbox(mailbox);
    }

    return mailbox;
  }

  /**
   * Sends an email message through the OMail Network.
   */
  public async sendMail(
    tokenOrSession: string,
    input: SendMailInput
  ): Promise<Readonly<OMailMessage>> {
    // 1. Authenticate caller (NET-02)
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    // 2. Verify sovereign identity (NET-01)
    if (this.identityRegistry && !this.identityRegistry.has(callerCubId)) {
      throw new Error(`OMail Error: Sovereign Identity '${callerCubId}' not found in NET-01 registry.`);
    }

    // 3. Verify active account (NET-04)
    if (this.accountService) {
      const account = await this.accountService.getAccount(callerCubId);
      if (account && account.status !== 'ACTIVE') {
        throw new Error(`OMail Error: Account '${callerCubId}' is ${account.status}. Sending mail blocked.`);
      }
    }

    // 4. Authorize MAIL_SEND (NET-03)
    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'MAIL_SEND',
        resourceUri: STANDARD_MAIL_COORDINATE,
      });
      if (!decision.allowed) {
        throw new Error(`OMail Authorization Denied: Identity '${callerCubId}' lacks MAIL_SEND permission.`);
      }
    }

    // 5. Anti-Spoofing & Sender Address Resolution
    let verifiedSenderAddress: string;
    if (input.senderAddress) {
      const requestedAddress = input.senderAddress.trim().toLowerCase();
      if (this.addressRegistry) {
        const resolution = await this.addressRegistry.resolveAddress(requestedAddress);
        if (!resolution.found || resolution.cubId !== callerCubId) {
          throw new Error(
            `Anti-Spoofing Security Violation: Identity '${callerCubId}' does not own sender address '${requestedAddress}'.`
          );
        }
      }
      verifiedSenderAddress = requestedAddress;
    } else {
      if (this.addressRegistry) {
        const owned = await this.addressRegistry.getAddressesForIdentity(callerCubId);
        if (owned.length === 0) {
          throw new Error(`OMail Error: Identity '${callerCubId}' has no registered OMail or CubiO address.`);
        }
        verifiedSenderAddress = owned[0].fullAddress;
      } else {
        verifiedSenderAddress = `${callerCubId.toLowerCase()}@omail.com`;
      }
    }

    // 6. Recipient Resolution
    if (!input.to || input.to.length === 0) {
      throw new Error('OMail Error: Message must specify at least one recipient in "to".');
    }

    const recipientAddresses: string[] = [];
    const recipientCubIds: string[] = [];

    for (const rawTo of input.to) {
      const trimmedTo = rawTo.trim();
      if (trimmedTo.startsWith('CUB-')) {
        recipientCubIds.push(trimmedTo);
        recipientAddresses.push(trimmedTo);
      } else if (this.addressRegistry) {
        const resolution = await this.addressRegistry.resolveAddress(trimmedTo);
        if (!resolution.found || !resolution.cubId) {
          throw new Error(`OMail Error: Recipient address '${trimmedTo}' could not be resolved to any sovereign identity.`);
        }
        recipientCubIds.push(resolution.cubId);
        recipientAddresses.push(resolution.address?.fullAddress || trimmedTo.toLowerCase());
      } else {
        recipientAddresses.push(trimmedTo.toLowerCase());
        recipientCubIds.push(trimmedTo);
      }
    }

    // 7. Attachment Processing (NET-06 Storage Integration)
    const attachments: OMailAttachment[] = [];
    if (input.attachments && input.attachments.length > 0) {
      for (const att of input.attachments) {
        let storageObjectId: string | undefined;
        let storageCoordinate: string | undefined;
        const sizeBytes = typeof att.data === 'string'
          ? Buffer.byteLength(att.data, 'utf8')
          : att.data.length;

        if (this.storageEngine) {
          const storedObj = await this.storageEngine.putObject(tokenOrSession, {
            name: att.name,
            data: att.data,
            mimeType: att.mimeType || 'application/octet-stream',
            visibility: 'SHARED',
            allowedCubIds: recipientCubIds,
          });
          storageObjectId = storedObj.objectId;
          storageCoordinate = storedObj.coordinateUri;
        }

        const attachmentId = `ATT_${deterministicHash(`${callerCubId}:${att.name}:${Date.now()}`).slice(2, 18)}`;
        attachments.push(
          Object.freeze({
            attachmentId,
            name: att.name,
            sizeBytes,
            mimeType: att.mimeType || 'application/octet-stream',
            storageObjectId,
            storageCoordinate,
            rawContent: att.data,
          })
        );
      }
    }

    // 8. Thread Resolution
    const now = Date.now();
    let threadId = input.threadId;
    if (!threadId) {
      if (input.inReplyToMailId) {
        const parentMsg = await this.repository.getMessage(input.inReplyToMailId);
        if (parentMsg) {
          threadId = parentMsg.threadId;
        }
      }
    }
    if (!threadId) {
      threadId = `THRD_${deterministicHash(`${callerCubId}:${input.subject}:${now}`).slice(2, 18)}`;
    }

    const mailId = `MAIL_${deterministicHash(`${callerCubId}:${recipientAddresses.join(',')}:${now}`).slice(2, 18)}`;

    // 9. Create Sender Copy (SENT folder)
    const senderCopy: OMailMessage = Object.freeze({
      mailId,
      threadId,
      ownerCubId: callerCubId,
      folder: 'SENT',
      senderCubId: callerCubId,
      senderAddress: verifiedSenderAddress,
      recipientAddresses: Object.freeze(recipientAddresses),
      recipientCubIds: Object.freeze(recipientCubIds),
      ccAddresses: input.cc ? Object.freeze([...input.cc]) : undefined,
      bccAddresses: input.bcc ? Object.freeze([...input.bcc]) : undefined,
      subject: input.subject.trim(),
      body: input.body,
      contentType: input.contentType || 'text/plain',
      attachments: Object.freeze(attachments),
      status: 'SENT',
      flags: Object.freeze({
        isRead: true,
        isStarred: false,
        isArchived: false,
        isSpam: false,
        isDraft: false,
      }),
      inReplyToMailId: input.inReplyToMailId,
      coordinateUri: STANDARD_MAIL_COORDINATE,
      sentAt: now,
      deliveredAt: now,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
    });

    await this.repository.saveMessage(senderCopy);

    // 10. Deliver to Each Recipient (INBOX folder)
    for (const recCubId of recipientCubIds) {
      const recipientMailId = `MAIL_${deterministicHash(`${recCubId}:${mailId}:${now}`).slice(2, 18)}`;
      const recipientCopy: OMailMessage = Object.freeze({
        mailId: recipientMailId,
        threadId,
        ownerCubId: recCubId,
        folder: 'INBOX',
        senderCubId: callerCubId,
        senderAddress: verifiedSenderAddress,
        recipientAddresses: Object.freeze(recipientAddresses),
        recipientCubIds: Object.freeze(recipientCubIds),
        ccAddresses: input.cc ? Object.freeze([...input.cc]) : undefined,
        bccAddresses: undefined, // BCC stripped for recipients
        subject: input.subject.trim(),
        body: input.body,
        contentType: input.contentType || 'text/plain',
        attachments: Object.freeze(attachments),
        status: 'DELIVERED',
        flags: Object.freeze({
          isRead: false,
          isStarred: false,
          isArchived: false,
          isSpam: false,
          isDraft: false,
        }),
        inReplyToMailId: input.inReplyToMailId,
        coordinateUri: STANDARD_MAIL_COORDINATE,
        sentAt: now,
        deliveredAt: now,
        createdAt: now,
        updatedAt: now,
        metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
      });

      await this.repository.saveMessage(recipientCopy);

      // Recipient Thread Record
      const snippet = input.body.slice(0, 100).replace(/\n/g, ' ');
      const recThread: OMailThread = Object.freeze({
        threadId,
        ownerCubId: recCubId,
        subject: input.subject.trim(),
        participantAddresses: Object.freeze([verifiedSenderAddress, ...recipientAddresses]),
        participantCubIds: Object.freeze([callerCubId, ...recipientCubIds]),
        messageCount: 1,
        lastMessageId: recipientMailId,
        lastMessageSnippet: snippet,
        lastActivityAt: now,
        isUnread: true,
      });
      await this.repository.saveThread(recThread);

      // 11. NET-05 Underlying Messaging Integration
      if (this.messagingEngine) {
        try {
          await this.messagingEngine.sendMessage(tokenOrSession, {
            recipientCubId: recCubId,
            content: `[OMail] ${input.subject}`,
            metadata: {
              mailId: recipientMailId,
              threadId,
              senderAddress: verifiedSenderAddress,
              subject: input.subject,
              hasAttachments: attachments.length > 0,
            },
          });
        } catch {
          // Messaging dispatch logged; mail record persisted
        }
      }
    }

    // Sender Thread Record
    const snippet = input.body.slice(0, 100).replace(/\n/g, ' ');
    const senderThread: OMailThread = Object.freeze({
      threadId,
      ownerCubId: callerCubId,
      subject: input.subject.trim(),
      participantAddresses: Object.freeze([verifiedSenderAddress, ...recipientAddresses]),
      participantCubIds: Object.freeze([callerCubId, ...recipientCubIds]),
      messageCount: 1,
      lastMessageId: mailId,
      lastMessageSnippet: snippet,
      lastActivityAt: now,
      isUnread: false,
    });
    await this.repository.saveThread(senderThread);

    return senderCopy;
  }

  /**
   * Saves or updates a draft message.
   */
  public async saveDraft(
    tokenOrSession: string,
    input: SaveDraftInput
  ): Promise<Readonly<OMailMessage>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const now = Date.now();

    let mailId = input.draftId;
    if (!mailId) {
      mailId = `MAIL_${deterministicHash(`DRAFT:${callerCubId}:${now}`).slice(2, 18)}`;
    }

    const threadId = input.threadId || `THRD_${deterministicHash(`DRAFT_THRD:${mailId}`).slice(2, 18)}`;

    const draft: OMailMessage = Object.freeze({
      mailId,
      threadId,
      ownerCubId: callerCubId,
      folder: 'DRAFTS',
      senderCubId: callerCubId,
      senderAddress: input.senderAddress || `${callerCubId.toLowerCase()}@omail.com`,
      recipientAddresses: input.to ? Object.freeze([...input.to]) : Object.freeze([]),
      recipientCubIds: Object.freeze([]),
      ccAddresses: input.cc ? Object.freeze([...input.cc]) : undefined,
      bccAddresses: input.bcc ? Object.freeze([...input.bcc]) : undefined,
      subject: input.subject || '(No Subject)',
      body: input.body || '',
      contentType: input.contentType || 'text/plain',
      attachments: Object.freeze([]),
      status: 'DRAFT',
      flags: Object.freeze({
        isRead: true,
        isStarred: false,
        isArchived: false,
        isSpam: false,
        isDraft: true,
      }),
      inReplyToMailId: input.inReplyToMailId,
      coordinateUri: STANDARD_MAIL_COORDINATE,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
    });

    await this.repository.saveMessage(draft);
    return draft;
  }

  /**
   * Retrieves a mail message by mailId, verifying ownership.
   */
  public async getMail(
    tokenOrSession: string,
    mailId: string,
    autoMarkRead: boolean = true
  ): Promise<Readonly<OMailMessage>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const msg = await this.repository.getMessage(mailId);

    if (!msg) {
      throw new Error(`OMail Error: Message '${mailId}' not found.`);
    }

    if (msg.ownerCubId !== callerCubId && msg.senderCubId !== callerCubId) {
      throw new Error(`OMail Access Denied: Caller '${callerCubId}' is not authorized to read message '${mailId}'.`);
    }

    if (autoMarkRead && !msg.flags.isRead && msg.ownerCubId === callerCubId) {
      const updated = await this.repository.updateMessageFlags(mailId, { isRead: true });
      return updated || msg;
    }

    return msg;
  }

  /**
   * Retrieves a thread with all messages in chronological order.
   */
  public async getThread(
    tokenOrSession: string,
    threadId: string
  ): Promise<Readonly<OMailThreadView>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    let thread = await this.repository.getThread(threadId, callerCubId);
    const messages = await this.repository.getMessagesByThread(threadId, callerCubId);

    if (messages.length === 0) {
      throw new Error(`OMail Error: Thread '${threadId}' not found for identity '${callerCubId}'.`);
    }

    if (!thread) {
      thread = Object.freeze({
        threadId,
        ownerCubId: callerCubId,
        subject: messages[0].subject,
        participantAddresses: Object.freeze(
          Array.from(new Set(messages.flatMap((m) => [m.senderAddress, ...m.recipientAddresses])))
        ),
        participantCubIds: Object.freeze(
          Array.from(new Set(messages.flatMap((m) => [m.senderCubId, ...m.recipientCubIds])))
        ),
        messageCount: messages.length,
        lastMessageId: messages[messages.length - 1].mailId,
        lastMessageSnippet: messages[messages.length - 1].body.slice(0, 100),
        lastActivityAt: messages[messages.length - 1].createdAt,
        isUnread: messages.some((m) => !m.flags.isRead),
      });
    }

    return Object.freeze({
      thread,
      messages,
    });
  }

  /**
   * Lists messages in a specific folder.
   */
  public async listFolder(
    tokenOrSession: string,
    folder: OMailFolderType,
    options: MailQueryOptions = {}
  ): Promise<readonly OMailMessage[]> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    return this.repository.getMessagesByOwner(callerCubId, { ...options, folder });
  }

  /**
   * Lists all threads for the caller.
   */
  public async listThreads(
    tokenOrSession: string,
    options: MailQueryOptions = {}
  ): Promise<readonly OMailThread[]> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    return this.repository.getThreadsByOwner(callerCubId, options);
  }

  /**
   * Marks a message as read.
   */
  public async markAsRead(tokenOrSession: string, mailId: string): Promise<OMailMessage> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const msg = await this.repository.getMessage(mailId);
    if (!msg || msg.ownerCubId !== callerCubId) {
      throw new Error(`OMail Error: Message '${mailId}' not found.`);
    }
    const updated = await this.repository.updateMessageFlags(mailId, { isRead: true });
    return updated || msg;
  }

  /**
   * Marks a message as unread.
   */
  public async markAsUnread(tokenOrSession: string, mailId: string): Promise<OMailMessage> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const msg = await this.repository.getMessage(mailId);
    if (!msg || msg.ownerCubId !== callerCubId) {
      throw new Error(`OMail Error: Message '${mailId}' not found.`);
    }
    const updated = await this.repository.updateMessageFlags(mailId, { isRead: false });
    return updated || msg;
  }

  /**
   * Toggles the starred flag on a message.
   */
  public async toggleStar(tokenOrSession: string, mailId: string): Promise<OMailMessage> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const msg = await this.repository.getMessage(mailId);
    if (!msg || msg.ownerCubId !== callerCubId) {
      throw new Error(`OMail Error: Message '${mailId}' not found.`);
    }
    const updated = await this.repository.updateMessageFlags(mailId, { isStarred: !msg.flags.isStarred });
    return updated || msg;
  }

  /**
   * Moves a message to a folder (e.g. TRASH or ARCHIVE).
   */
  public async moveToFolder(
    tokenOrSession: string,
    mailId: string,
    folder: OMailFolderType
  ): Promise<boolean> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const msg = await this.repository.getMessage(mailId);
    if (!msg || msg.ownerCubId !== callerCubId) {
      throw new Error(`OMail Error: Message '${mailId}' not found.`);
    }
    return this.repository.moveMessage(mailId, folder);
  }

  /**
   * Permanently deletes a message from the mailbox.
   */
  public async deleteMail(tokenOrSession: string, mailId: string): Promise<boolean> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const msg = await this.repository.getMessage(mailId);
    if (!msg || msg.ownerCubId !== callerCubId) {
      throw new Error(`OMail Error: Message '${mailId}' not found.`);
    }
    return this.repository.deleteMessage(mailId);
  }
}
