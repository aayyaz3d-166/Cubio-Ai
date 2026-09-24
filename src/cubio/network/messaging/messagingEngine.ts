/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-05: Sovereign Messaging & Communication Engine
 *
 * Implements end-to-end authenticated, authorized, coordinate-routed messaging:
 * Sender -> NET-03 Authorization -> Create Message -> CubiO Communication Router -> Receiver -> Delivery / Read State.
 *
 * Core Abstractions:
 * - sendMessage()
 * - receiveMessage()
 * - getConversation()
 * - markAsRead()
 * - revokeMessage()
 * - deleteMessage()
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOCryptoEngine } from '../../security/crypto';
import { CubiONetworkStack } from '../stack';
import { CubiOIdentityCoordinateAdapter } from '../identity/coordinateAdapter';
import { CubiOMessageRouter } from './messageRouter';
import { CubiOChannelManager } from './channelManager';
import { CubiOCommunicationIdentityManager } from './communicationIdentity';
import { CubiOConversationManager } from './conversationManager';
import {
  CubiOMessage,
  SendMessageInput,
  MessageFilter,
  MessageType,
  MessagePriority,
  CommunicationMode,
  CubiOConversation,
} from './types';
import { IMessageRepository } from './repositories/types';
import { MemoryMessageRepository } from './repositories/memoryRepositories';

export class CubiOMessagingEngine {
  private stack: CubiONetworkStack;
  private messageRepository: IMessageRepository;
  private channelManager: CubiOChannelManager;
  private messageRouter: CubiOMessageRouter;
  private identityManager: CubiOCommunicationIdentityManager;
  private conversationManager: CubiOConversationManager;
  private subscribers: Set<(msg: CubiOMessage) => void> = new Set();
  private signingSecret: string;

  constructor(options: {
    stack?: CubiONetworkStack;
    messageRepository?: IMessageRepository;
    channelManager?: CubiOChannelManager;
    identityManager?: CubiOCommunicationIdentityManager;
    conversationManager?: CubiOConversationManager;
    signingSecret?: string;
  } = {}) {
    this.stack = options.stack || new CubiONetworkStack();
    this.messageRepository = options.messageRepository || new MemoryMessageRepository();
    this.channelManager = options.channelManager || new CubiOChannelManager();
    this.messageRouter = new CubiOMessageRouter(this.stack.router);
    this.identityManager =
      options.identityManager ||
      new CubiOCommunicationIdentityManager(this.stack.identityRegistry, this.stack.accountService);
    this.conversationManager =
      options.conversationManager || new CubiOConversationManager(this.identityManager);
    this.signingSecret = options.signingSecret || 'CUBIO_MSG_SIGNING_SECRET_DEFAULT';
  }

  public getStack(): CubiONetworkStack {
    return this.stack;
  }

  public getChannelManager(): CubiOChannelManager {
    return this.channelManager;
  }

  public getIdentityManager(): CubiOCommunicationIdentityManager {
    return this.identityManager;
  }

  public getConversationManager(): CubiOConversationManager {
    return this.conversationManager;
  }

  public getMessageRepository(): IMessageRepository {
    return this.messageRepository;
  }

  /**
   * Subscribes to real-time message broadcasts.
   */
  public subscribe(listener: (msg: CubiOMessage) => void): () => void {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  /**
   * 1. sendMessage() — Sends an authenticated, authorized, coordinate-routed message.
   */
  public async sendMessage(
    tokenStringOrSessionId: string,
    input: SendMessageInput
  ): Promise<Readonly<CubiOMessage>> {
    const traceHops: string[] = ['MSG_PIPELINE_START'];

    // 1. Authenticate sender session via NET-02
    traceHops.push('NET02_AUTH_CHECK');
    let authVerification;
    if (tokenStringOrSessionId.startsWith('CUBTOK.')) {
      authVerification = await this.stack.authEngine.verifyToken(tokenStringOrSessionId);
    } else {
      authVerification = await this.stack.authEngine.verifySession(tokenStringOrSessionId);
    }

    if (!authVerification.isValid || !authVerification.identity || !authVerification.session) {
      throw new Error(`Authentication failed: ${authVerification.error || 'Invalid session credentials.'}`);
    }

    const { identity, session } = authVerification;
    traceHops.push(`NET01_SENDER_RESOLVED:${identity.cubId}`);

    // 2. Verify sender account active via NET-04 (if user)
    traceHops.push('NET04_ACCOUNT_CHECK');
    const senderAccount = await this.stack.accountService.getAccount(identity.cubId);
    if (senderAccount && senderAccount.status !== 'ACTIVE') {
      throw new Error(`Account status is '${senderAccount.status}'. Cannot transmit messages.`);
    }

    // 3. Resolve destination coordinate & recipient
    let recipientCoordinateUri = input.recipientCoordinateUri;
    let recipientCubId = input.receiverCubId || input.recipientCubId;
    let communicationMode: CommunicationMode | undefined;

    if (input.recipientAddress && !recipientCubId) {
      const resolved = await this.identityManager.resolveCommunicationIdentityByAddress(input.recipientAddress);
      recipientCubId = resolved.cubId;
      if (!recipientCoordinateUri) {
        recipientCoordinateUri = resolved.coordinateUri;
      }
      if (!communicationMode) {
        communicationMode = this.identityManager.determineCommunicationMode(
          identity.type,
          resolved.entityType
        );
      }
    }

    if (input.conversationId) {
      const conv = await this.conversationManager.getConversation(input.conversationId);
      if (conv) {
        communicationMode = conv.communicationMode;
        const otherParticipant = conv.participantCubIds.find((id) => id !== identity.cubId);
        if (otherParticipant && !recipientCubId) {
          recipientCubId = otherParticipant;
        }
      }
    }

    if (recipientCubId && !recipientCoordinateUri) {
      const recipientIdentity = await this.identityManager.resolveCommunicationIdentity(recipientCubId);
      recipientCoordinateUri = recipientIdentity.coordinateUri;
      if (!communicationMode) {
        communicationMode = this.identityManager.determineCommunicationMode(
          identity.type,
          recipientIdentity.entityType
        );
      }
    }

    if (!recipientCoordinateUri) {
      throw new Error('Destination coordinate or recipientCubId is required.');
    }

    // 4. NET-03 Authorization Check
    const requiredAction = input.type === 'CHANNEL' ? 'SERVICE_INVOKE' : 'MAIL_SEND';
    traceHops.push(`NET03_AUTHZ_CHECK:${requiredAction}`);
    const authzResult = await this.stack.authzMiddleware.authorizeRequest(
      this.stack.authEngine,
      tokenStringOrSessionId,
      recipientCoordinateUri,
      requiredAction
    );

    if (!authzResult.authorized) {
      throw new Error(`Authorization denied: ${authzResult.error || 'Access policy restricted'}`);
    }

    // 5. CubiO Communication Router (NET-00 Route Resolution)
    traceHops.push(`NET00_ROUTING:${recipientCoordinateUri}`);
    const route = this.messageRouter.resolveDeliveryRoute(recipientCoordinateUri);
    if (!route.canDeliver) {
      throw new Error(`Routing failed: ${route.error || 'Destination undeliverable'}`);
    }
    traceHops.push(...route.traceHops);

    // 6. Synthesize Sender Coordinate
    const senderCoordinateUri = CubiOIdentityCoordinateAdapter.formatIdentityAddress(identity, {
      dimension: senderAccount?.settings?.defaultDimension || 0,
      zone: senderAccount?.settings?.defaultZone || 1,
    });

    const now = Date.now();
    const messageId = `MSG_${deterministicHash(`${identity.cubId}:${recipientCoordinateUri}:${now}:${input.content}`).slice(2, 18)}`;

    // 7. Cryptographic message signature
    const signaturePayload = `${messageId}:${identity.cubId}:${recipientCoordinateUri}:${now}:${input.content}`;
    const signature = CubiOCryptoEngine.signMessage(signaturePayload, this.signingSecret);

    traceHops.push('MSG_SIGNED');

    // 8. Channel membership verification if channel message
    if (input.channelId) {
      const channel = await this.channelManager.getChannel(input.channelId);
      if (channel && channel.isPrivate && !channel.members.includes(identity.cubId)) {
        throw new Error(`Forbidden: Sender '${identity.cubId}' is not a member of private channel '${channel.name}'.`);
      }
    }

    // 9. Create Message object
    traceHops.push('MSG_DELIVERED');
    const metadataObj = input.metadata || input.payload;
    const message: CubiOMessage = Object.freeze({
      messageId,
      conversationId: input.conversationId,
      type: input.type || 'DIRECT',
      senderCubId: identity.cubId,
      senderCoordinateUri,
      receiverCubId: recipientCubId,
      recipientCubId,
      recipientCoordinateUri,
      channelId: input.channelId,
      communicationMode,
      priority: input.priority || 'NORMAL',
      subject: input.subject,
      content: input.content,
      metadata: metadataObj ? Object.freeze({ ...metadataObj }) : undefined,
      payload: metadataObj ? Object.freeze({ ...metadataObj }) : undefined,
      signature,
      status: 'DELIVERED',
      traceHops: Object.freeze(traceHops),
      createdAt: now,
      sentAt: now,
      deliveredAt: now,
    });

    // 10. Persist to repository
    await this.messageRepository.saveMessage(message);

    // 11. Update conversation if applicable
    if (input.conversationId) {
      await this.conversationManager.recordMessageInConversation(
        input.conversationId,
        messageId,
        input.content
      );
    }

    // 12. Notify subscribers
    this.subscribers.forEach((sub) => {
      try {
        sub(message);
      } catch {
        // Safe subscriber isolation
      }
    });

    return message;
  }

  /**
   * 2. receiveMessage() — Retrieves a specific message addressed to a sovereign recipient.
   */
  public async receiveMessage(
    receiverCubId: string,
    messageId: string
  ): Promise<Readonly<CubiOMessage> | undefined> {
    const msg = await this.messageRepository.getMessageById(messageId);
    if (!msg) return undefined;

    const cleanReceiver = receiverCubId.trim();
    if (msg.receiverCubId && msg.receiverCubId !== cleanReceiver && msg.recipientCubId !== cleanReceiver) {
      throw new Error(`Forbidden: Identity '${cleanReceiver}' is not the recipient of message '${messageId}'.`);
    }

    return msg;
  }

  /**
   * 3. getConversation() — Retrieves conversation metadata and chronological message history.
   */
  public async getConversation(
    conversationId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ conversation: CubiOConversation; messages: readonly CubiOMessage[] } | undefined> {
    const conversation = await this.conversationManager.getConversation(conversationId);
    if (!conversation) return undefined;

    const messages = await this.messageRepository.listMessages({
      conversationId: conversation.conversationId,
      limit: options.limit || 50,
      offset: options.offset,
    });

    return {
      conversation,
      messages,
    };
  }

  /**
   * 4. markAsRead() — Updates message delivery status to READ.
   */
  public async markAsRead(messageId: string, readerCubId: string): Promise<boolean> {
    const msg = await this.messageRepository.getMessageById(messageId);
    if (!msg) return false;

    const cleanReader = readerCubId.trim();
    const targetRecipient = msg.receiverCubId || msg.recipientCubId;
    if (targetRecipient && targetRecipient !== cleanReader) {
      throw new Error(`Forbidden: Identity '${cleanReader}' is not the recipient of message '${messageId}'.`);
    }

    return this.messageRepository.updateMessageStatus(messageId, 'READ', Date.now());
  }

  /**
   * 5. revokeMessage() — Allows sender to recall/revoke a delivered message.
   */
  public async revokeMessage(
    messageId: string,
    callerCubId: string,
    reason?: string
  ): Promise<boolean> {
    const msg = await this.messageRepository.getMessageById(messageId);
    if (!msg) return false;

    const cleanCaller = callerCubId.trim();
    if (msg.senderCubId !== cleanCaller) {
      throw new Error(`Forbidden: Only sender '${msg.senderCubId}' can revoke message '${messageId}'.`);
    }

    return this.messageRepository.updateMessageStatus(messageId, 'REVOKED', Date.now());
  }

  /**
   * 6. deleteMessage() — Deletes a message from storage.
   */
  public async deleteMessage(messageId: string, callerCubId: string): Promise<boolean> {
    const msg = await this.messageRepository.getMessageById(messageId);
    if (!msg) return false;

    const cleanCaller = callerCubId.trim();
    if (msg.senderCubId !== cleanCaller && msg.receiverCubId !== cleanCaller && msg.recipientCubId !== cleanCaller) {
      throw new Error(`Forbidden: Caller '${cleanCaller}' is neither sender nor recipient of message '${messageId}'.`);
    }

    return this.messageRepository.deleteMessage(messageId);
  }

  /**
   * Retrieves messages received by a sovereign CUB ID.
   */
  public async getInbox(
    recipientCubId: string,
    filter?: Omit<MessageFilter, 'recipientCubId' | 'receiverCubId'>
  ): Promise<readonly CubiOMessage[]> {
    return this.messageRepository.listMessages({
      ...filter,
      receiverCubId: recipientCubId.trim(),
    });
  }

  /**
   * Retrieves messages sent by a sovereign CUB ID.
   */
  public async getOutbox(
    senderCubId: string,
    filter?: Omit<MessageFilter, 'senderCubId'>
  ): Promise<readonly CubiOMessage[]> {
    return this.messageRepository.listMessages({
      ...filter,
      senderCubId: senderCubId.trim(),
    });
  }

  /**
   * Retrieves messages within a specific channel.
   */
  public async getChannelMessages(
    channelId: string,
    limit = 50
  ): Promise<readonly CubiOMessage[]> {
    return this.messageRepository.listMessages({
      channelId: channelId.trim(),
      limit,
    });
  }
}
