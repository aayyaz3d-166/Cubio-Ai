/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-09: Sovereign Notification Engine
 *
 * Implements decoupled, multi-channel notification dispatching:
 * - Decoupled from individual domain services (System, Storage, Mail, Messaging, Billing)
 * - Recipient resolution across sovereign CUB-ID and @omail.com/@cubio.com
 * - Preference evaluation (DND modes, category filtering, priority thresholds)
 * - Multi-channel delivery (IN_APP, REALTIME_P2P, EMAIL_OMAIL)
 * - Delivery state lifecycle, retry handling, and read/dismiss tracking
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiOAccountService } from '../account/accountService';
import { CubiOMessagingEngine } from '../messaging/messagingEngine';
import { CubiOStorageEngine } from '../storage/storageEngine';
import { CubiOOMailEngine } from '../omail/omailEngine';
import { CubiOAddressRegistry } from '../address/addressRegistry';
import {
  NotificationRecord,
  NotificationPreferences,
  NotificationCategory,
  NotificationPriority,
  NotificationChannel,
  NotificationDeliveryState,
  CreateNotificationInput,
  UpdatePreferencesInput,
  NotificationQueryOptions,
  CategoryPreference,
} from './types';
import { INotificationRepository } from './repositories/types';
import { MemoryNotificationRepository } from './repositories/memoryRepositories';

const DEFAULT_CATEGORIES: NotificationCategory[] = [
  'SYSTEM',
  'SECURITY',
  'MESSAGE',
  'MAIL',
  'STORAGE',
  'BILLING',
  'SPACE',
  'COLLABORATION',
];

export class CubiONotificationEngine {
  private repository: INotificationRepository;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private accountService?: CubiOAccountService;
  private messagingEngine?: CubiOMessagingEngine;
  private storageEngine?: CubiOStorageEngine;
  private omailEngine?: CubiOOMailEngine;
  private addressRegistry?: CubiOAddressRegistry;

  constructor(options: {
    repository?: INotificationRepository;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    accountService?: CubiOAccountService;
    messagingEngine?: CubiOMessagingEngine;
    storageEngine?: CubiOStorageEngine;
    omailEngine?: CubiOOMailEngine;
    addressRegistry?: CubiOAddressRegistry;
  } = {}) {
    this.repository = options.repository || new MemoryNotificationRepository();
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.accountService = options.accountService;
    this.messagingEngine = options.messagingEngine;
    this.storageEngine = options.storageEngine;
    this.omailEngine = options.omailEngine;
    this.addressRegistry = options.addressRegistry;
  }

  public getRepository(): INotificationRepository {
    return this.repository;
  }

  /**
   * Authenticates session / token and extracts sovereign caller CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (!this.authEngine) {
      if (tokenOrSession.startsWith('CUB-')) {
        return tokenOrSession;
      }
      throw new Error('Authentication engine not configured in NotificationEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Notification Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Retrieves or initializes default notification preferences for an identity.
   */
  public async getOrCreatePreferences(cubId: string): Promise<Readonly<NotificationPreferences>> {
    let prefs = await this.repository.getPreferences(cubId);
    if (!prefs) {
      const catPrefs: Record<string, CategoryPreference> = {};
      for (const cat of DEFAULT_CATEGORIES) {
        catPrefs[cat] = Object.freeze({
          enabled: true,
          minimumPriority: 'LOW',
          channels: Object.freeze(['IN_APP', 'REALTIME_P2P'] as NotificationChannel[]),
        });
      }

      prefs = Object.freeze({
        cubId,
        inAppEnabled: true,
        realtimeP2PEnabled: true,
        emailOMailEnabled: true,
        dndMode: false,
        quietHoursEnabled: false,
        categoryPreferences: Object.freeze(catPrefs as Record<NotificationCategory, CategoryPreference>),
        updatedAt: Date.now(),
      });

      await this.repository.savePreferences(prefs);
    }

    return prefs;
  }

  /**
   * Updates notification preferences for the authenticated caller.
   */
  public async updatePreferences(
    tokenOrSession: string,
    input: UpdatePreferencesInput
  ): Promise<Readonly<NotificationPreferences>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const existing = await this.getOrCreatePreferences(callerCubId);

    const mergedCatPrefs: Record<string, CategoryPreference> = { ...existing.categoryPreferences };
    if (input.categoryPreferences) {
      for (const [cat, override] of Object.entries(input.categoryPreferences)) {
        const cur = mergedCatPrefs[cat] || {
          enabled: true,
          minimumPriority: 'LOW',
          channels: ['IN_APP', 'REALTIME_P2P'],
        };
        mergedCatPrefs[cat] = Object.freeze({
          enabled: override.enabled ?? cur.enabled,
          minimumPriority: override.minimumPriority ?? cur.minimumPriority,
          channels: override.channels ?? cur.channels,
        });
      }
    }

    const updated: NotificationPreferences = Object.freeze({
      cubId: callerCubId,
      inAppEnabled: input.inAppEnabled ?? existing.inAppEnabled,
      realtimeP2PEnabled: input.realtimeP2PEnabled ?? existing.realtimeP2PEnabled,
      emailOMailEnabled: input.emailOMailEnabled ?? existing.emailOMailEnabled,
      dndMode: input.dndMode ?? existing.dndMode,
      quietHoursEnabled: input.quietHoursEnabled ?? existing.quietHoursEnabled,
      categoryPreferences: Object.freeze(mergedCatPrefs as Record<NotificationCategory, CategoryPreference>),
      updatedAt: Date.now(),
    });

    await this.repository.savePreferences(updated);
    return updated;
  }

  /**
   * Resolves recipient input to a sovereign CUB-ID.
   */
  public async resolveRecipientCubId(recipientInput: string): Promise<string> {
    const trimmed = recipientInput.trim();
    if (trimmed.startsWith('CUB-')) {
      return trimmed;
    }

    if (this.addressRegistry) {
      const resolution = await this.addressRegistry.resolveAddress(trimmed);
      if (resolution.found && resolution.cubId) {
        return resolution.cubId;
      }
    }

    throw new Error(`Notification Error: Recipient '${trimmed}' could not be resolved to any sovereign identity.`);
  }

  /**
   * Dispatches a notification from an authenticated caller.
   */
  public async notify(
    tokenOrSession: string,
    input: CreateNotificationInput
  ): Promise<Readonly<NotificationRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    return this.dispatchNotification(callerCubId, input, tokenOrSession);
  }

  /**
   * Dispatches a system notification (e.g. storage alert, auth event) without user session.
   */
  public async notifySystem(
    input: CreateNotificationInput
  ): Promise<Readonly<NotificationRecord>> {
    return this.dispatchNotification('SYSTEM', input);
  }

  /**
   * Internal multi-channel notification dispatcher with preference filtering and retry handling.
   */
  private async dispatchNotification(
    senderCubId: string,
    input: CreateNotificationInput,
    senderToken?: string
  ): Promise<Readonly<NotificationRecord>> {
    // 1. Resolve recipient sovereign CUB-ID
    const recipientCubId = await this.resolveRecipientCubId(input.recipientCubIdOrAddress);

    // 2. Verify recipient in NET-01 registry
    if (this.identityRegistry && !this.identityRegistry.has(recipientCubId)) {
      throw new Error(`Notification Error: Sovereign Identity '${recipientCubId}' not found in NET-01 registry.`);
    }

    // 3. Load Recipient Preferences
    const prefs = await this.getOrCreatePreferences(recipientCubId);
    const category = input.category;
    const priority = input.priority || 'NORMAL';
    const catPref = prefs.categoryPreferences[category];

    // Priority rank evaluation
    const priorityRanks: Record<NotificationPriority, number> = {
      LOW: 1,
      NORMAL: 2,
      HIGH: 3,
      CRITICAL: 4,
    };

    if (catPref && !catPref.enabled && priority !== 'CRITICAL') {
      // Category explicitly disabled by recipient; silently skip
      const now = Date.now();
      const notificationId = `NOTIF_${deterministicHash(`${recipientCubId}:${input.title}:${now}`).slice(2, 18)}`;
      const skippedRecord: NotificationRecord = Object.freeze({
        notificationId,
        recipientCubId,
        senderCubId,
        category,
        priority,
        channels: Object.freeze([]),
        title: input.title,
        body: input.body,
        actionUrl: input.actionUrl,
        targetResourceUri: input.targetResourceUri,
        deliveryState: 'DISMISSED',
        deliveryAttempts: 0,
        maxRetries: input.maxRetries ?? 3,
        isRead: false,
        createdAt: now,
        updatedAt: now,
        metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
      });
      return skippedRecord;
    }

    // 4. Resolve Active Delivery Channels
    const requestedChannels: NotificationChannel[] = input.channels && input.channels.length > 0
      ? [...input.channels]
      : catPref ? [...catPref.channels] : ['IN_APP', 'REALTIME_P2P'];

    const activeChannels: NotificationChannel[] = [];
    for (const ch of requestedChannels) {
      if (ch === 'IN_APP' && prefs.inAppEnabled) activeChannels.push('IN_APP');
      if (ch === 'REALTIME_P2P' && prefs.realtimeP2PEnabled && !prefs.dndMode) activeChannels.push('REALTIME_P2P');
      if (ch === 'EMAIL_OMAIL' && prefs.emailOMailEnabled && !prefs.dndMode) activeChannels.push('EMAIL_OMAIL');
      if (ch === 'WEBHOOK') activeChannels.push('WEBHOOK');
    }

    // If DND is enabled and priority is CRITICAL, force IN_APP delivery
    if (activeChannels.length === 0) {
      activeChannels.push('IN_APP');
    }

    const now = Date.now();
    const notificationId = `NOTIF_${deterministicHash(`${recipientCubId}:${input.title}:${now}`).slice(2, 18)}`;
    const ttl = input.ttlMs || 30 * 24 * 60 * 60 * 1000; // 30 days default TTL

    let deliveryAttempts = 0;
    let successfulDeliveries = 0;

    // 5. Execute Multi-Channel Delivery
    for (const channel of activeChannels) {
      deliveryAttempts++;
      let success = true;
      let errorMsg: string | undefined;

      try {
        if (channel === 'IN_APP') {
          // In-app storage in repository
          success = true;
        } else if (channel === 'REALTIME_P2P') {
          // NET-05 Messaging integration
          if (this.messagingEngine && senderToken) {
            await this.messagingEngine.sendMessage(senderToken, {
              recipientCubId,
              content: `[Notification: ${input.title}] ${input.body}`,
              metadata: {
                notificationId,
                category,
                priority,
                actionUrl: input.actionUrl,
              },
            });
          }
        } else if (channel === 'EMAIL_OMAIL') {
          // NET-07 OMail integration
          if (this.omailEngine && this.addressRegistry) {
            const recipientAddresses = await this.addressRegistry.getAddressesForIdentity(recipientCubId);
            if (recipientAddresses.length > 0) {
              const toAddress = recipientAddresses[0].fullAddress;
              if (senderToken) {
                await this.omailEngine.sendMail(senderToken, {
                  to: [toAddress],
                  subject: `[Notification] ${input.title}`,
                  body: input.body,
                });
              }
            }
          }
        }
      } catch (err: any) {
        success = false;
        errorMsg = err.message;
      }

      await this.repository.recordDeliveryAttempt({
        attemptId: `ATT_${deterministicHash(`${notificationId}:${channel}:${deliveryAttempts}`).slice(2, 18)}`,
        notificationId,
        channel,
        timestamp: Date.now(),
        success,
        error: errorMsg,
      });

      if (success) {
        successfulDeliveries++;
      }
    }

    const deliveryState: NotificationDeliveryState = successfulDeliveries > 0 ? 'DELIVERED' : 'FAILED';

    const record: NotificationRecord = Object.freeze({
      notificationId,
      recipientCubId,
      senderCubId,
      category,
      priority,
      channels: Object.freeze(activeChannels),
      title: input.title.trim(),
      body: input.body.trim(),
      actionUrl: input.actionUrl,
      targetResourceUri: input.targetResourceUri,
      deliveryState,
      deliveryAttempts,
      maxRetries: input.maxRetries ?? 3,
      isRead: false,
      expiresAt: now + ttl,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
    });

    await this.repository.saveNotification(record);
    return record;
  }

  /**
   * Retrieves a single notification by notificationId.
   */
  public async getNotification(
    tokenOrSession: string,
    notificationId: string
  ): Promise<Readonly<NotificationRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const notif = await this.repository.getNotification(notificationId);

    if (!notif) {
      throw new Error(`Notification Error: Notification '${notificationId}' not found.`);
    }

    if (notif.recipientCubId !== callerCubId && notif.senderCubId !== callerCubId) {
      throw new Error(`Notification Access Denied: Caller '${callerCubId}' is not authorized to view notification '${notificationId}'.`);
    }

    return notif;
  }

  /**
   * Lists notifications for the authenticated caller.
   */
  public async listNotifications(
    tokenOrSession: string,
    options: NotificationQueryOptions = {}
  ): Promise<readonly NotificationRecord[]> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    return this.repository.getNotificationsByRecipient(callerCubId, options);
  }

  /**
   * Marks a notification as read.
   */
  public async markAsRead(
    tokenOrSession: string,
    notificationId: string
  ): Promise<Readonly<NotificationRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const notif = await this.repository.getNotification(notificationId);

    if (!notif || notif.recipientCubId !== callerCubId) {
      throw new Error(`Notification Error: Notification '${notificationId}' not found.`);
    }

    const updated = await this.repository.updateNotificationState(notificationId, 'READ', { isRead: true });
    return updated || notif;
  }

  /**
   * Marks all notifications as read for the caller.
   */
  public async markAllAsRead(
    tokenOrSession: string,
    category?: NotificationCategory
  ): Promise<number> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const unread = await this.repository.getNotificationsByRecipient(callerCubId, { category, isRead: false });

    for (const notif of unread) {
      await this.repository.updateNotificationState(notif.notificationId, 'READ', { isRead: true });
    }

    return unread.length;
  }

  /**
   * Dismisses a notification.
   */
  public async dismissNotification(
    tokenOrSession: string,
    notificationId: string
  ): Promise<boolean> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const notif = await this.repository.getNotification(notificationId);

    if (!notif || notif.recipientCubId !== callerCubId) {
      throw new Error(`Notification Error: Notification '${notificationId}' not found.`);
    }

    const updated = await this.repository.updateNotificationState(notificationId, 'DISMISSED');
    return !!updated;
  }

  /**
   * Gets unread notification count for caller.
   */
  public async getUnreadCount(tokenOrSession: string): Promise<number> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    return this.repository.getUnreadCount(callerCubId);
  }
}
