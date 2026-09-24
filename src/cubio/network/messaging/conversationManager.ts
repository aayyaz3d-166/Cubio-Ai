/**
 * CubiO — Universal Spatial Operating Environment
 * Process 1: Conversation Manager
 *
 * Manages 1:1 and multi-party conversations structured around sovereign CUB-XXXXXXXX identities.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOCommunicationIdentityManager } from './communicationIdentity';
import {
  CubiOConversation,
  ConversationType,
  CommunicationMode,
} from './types';

export class CubiOConversationManager {
  private identityManager: CubiOCommunicationIdentityManager;
  private conversations: Map<string, CubiOConversation> = new Map();
  private directConversationsIndex: Map<string, string> = new Map(); // sortedKey -> conversationId

  constructor(identityManager?: CubiOCommunicationIdentityManager) {
    this.identityManager = identityManager || new CubiOCommunicationIdentityManager();
  }

  public getIdentityManager(): CubiOCommunicationIdentityManager {
    return this.identityManager;
  }

  /**
   * Retrieves or creates a 1:1 direct conversation between two sovereign identities.
   */
  public async getOrCreateDirectConversation(
    participant1CubId: string,
    participant2CubId: string
  ): Promise<Readonly<CubiOConversation>> {
    const { sender, recipient, communicationMode } =
      await this.identityManager.validateCommunicationPair(participant1CubId, participant2CubId);

    const sortedKey = [sender.cubId, recipient.cubId].sort().join(':');
    const existingId = this.directConversationsIndex.get(sortedKey);

    if (existingId) {
      const existing = this.conversations.get(existingId);
      if (existing) return existing;
    }

    const conversationId = `CONV_${deterministicHash(sortedKey).slice(2, 18)}`;
    const now = Date.now();

    let convType: ConversationType = 'DIRECT';
    if (communicationMode === 'USER_AGENT' || communicationMode === 'AGENT_AGENT') {
      convType = 'AGENT_TASK';
    } else if (communicationMode === 'USER_SERVICE' || communicationMode === 'SERVICE_SERVICE') {
      convType = 'SERVICE_STREAM';
    }

    const conversation: CubiOConversation = Object.freeze({
      conversationId,
      type: convType,
      title: `${sender.displayName} & ${recipient.displayName}`,
      communicationMode,
      participantCubIds: Object.freeze([sender.cubId, recipient.cubId]),
      participants: Object.freeze([sender, recipient]),
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    this.conversations.set(conversationId, conversation);
    this.directConversationsIndex.set(sortedKey, conversationId);

    return conversation;
  }

  /**
   * Creates a multi-party group conversation.
   */
  public async createGroupConversation(
    creatorCubId: string,
    participantCubIds: string[],
    title?: string
  ): Promise<Readonly<CubiOConversation>> {
    const allCubIds = Array.from(new Set([creatorCubId.trim(), ...participantCubIds.map((id) => id.trim())]));

    const participants = await Promise.all(
      allCubIds.map((id) => this.identityManager.resolveCommunicationIdentity(id))
    );

    const now = Date.now();
    const conversationId = `CONV_GRP_${deterministicHash(`${creatorCubId}:${now}:${allCubIds.join(',')}`).slice(2, 18)}`;

    const conversation: CubiOConversation = Object.freeze({
      conversationId,
      type: 'GROUP',
      title: title || `Group (${participants.length} participants)`,
      participantCubIds: Object.freeze(allCubIds),
      participants: Object.freeze(participants),
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    this.conversations.set(conversationId, conversation);
    return conversation;
  }

  /**
   * Retrieves a conversation by ID.
   */
  public async getConversation(
    conversationId: string
  ): Promise<Readonly<CubiOConversation> | undefined> {
    return this.conversations.get(conversationId.trim());
  }

  /**
   * Lists all conversations involving a specific sovereign CUB ID.
   */
  public async listConversationsForIdentity(
    cubId: string
  ): Promise<readonly CubiOConversation[]> {
    const cleanCubId = cubId.trim();
    const list = Array.from(this.conversations.values()).filter((c) =>
      c.participantCubIds.includes(cleanCubId)
    );
    list.sort((a, b) => b.updatedAt - a.updatedAt);
    return Object.freeze(list);
  }

  /**
   * Updates conversation metadata with new message details.
   */
  public async recordMessageInConversation(
    conversationId: string,
    messageId: string,
    snippet: string
  ): Promise<void> {
    const existing = this.conversations.get(conversationId.trim());
    if (!existing) return;

    const updated: CubiOConversation = Object.freeze({
      ...existing,
      lastMessageId: messageId,
      lastMessageSnippet: snippet.slice(0, 80),
      messageCount: existing.messageCount + 1,
      updatedAt: Date.now(),
    });

    this.conversations.set(existing.conversationId, updated);
  }
}
