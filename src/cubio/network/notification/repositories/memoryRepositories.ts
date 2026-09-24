/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-09: In-Memory Notification Repository
 */

import {
  NotificationRecord,
  NotificationPreferences,
  DeliveryAttemptRecord,
  NotificationDeliveryState,
  NotificationQueryOptions,
  NotificationCategory,
} from '../types';
import { INotificationRepository } from './types';

export class MemoryNotificationRepository implements INotificationRepository {
  private notifications: Map<string, NotificationRecord> = new Map(); // notificationId -> NotificationRecord
  private preferences: Map<string, NotificationPreferences> = new Map(); // cubId -> NotificationPreferences
  private attempts: Map<string, DeliveryAttemptRecord[]> = new Map(); // notificationId -> DeliveryAttemptRecord[]

  // --- NOTIFICATIONS ---

  public async saveNotification(notification: NotificationRecord): Promise<void> {
    this.notifications.set(notification.notificationId, Object.freeze({ ...notification }));
  }

  public async getNotification(notificationId: string): Promise<NotificationRecord | undefined> {
    return this.notifications.get(notificationId);
  }

  public async getNotificationsByRecipient(
    recipientCubId: string,
    options: NotificationQueryOptions = {}
  ): Promise<readonly NotificationRecord[]> {
    let matches: NotificationRecord[] = [];

    for (const notif of this.notifications.values()) {
      if (notif.recipientCubId !== recipientCubId) continue;
      if (options.category && notif.category !== options.category) continue;
      if (options.isRead !== undefined && notif.isRead !== options.isRead) continue;
      if (options.priority && notif.priority !== options.priority) continue;
      if (notif.deliveryState === 'DISMISSED') continue;

      matches.push(notif);
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

  public async updateNotificationState(
    notificationId: string,
    state: NotificationDeliveryState,
    extra: Partial<NotificationRecord> = {}
  ): Promise<NotificationRecord | undefined> {
    const existing = this.notifications.get(notificationId);
    if (!existing) return undefined;

    const updated: NotificationRecord = Object.freeze({
      ...existing,
      ...extra,
      deliveryState: state,
      isRead: state === 'READ' ? true : extra.isRead ?? existing.isRead,
      readAt: state === 'READ' && !existing.isRead ? Date.now() : extra.readAt ?? existing.readAt,
      dismissedAt: state === 'DISMISSED' ? Date.now() : existing.dismissedAt,
      updatedAt: Date.now(),
    });

    this.notifications.set(notificationId, updated);
    return updated;
  }

  public async deleteNotification(notificationId: string): Promise<boolean> {
    return this.notifications.delete(notificationId);
  }

  public async getUnreadCount(recipientCubId: string): Promise<number> {
    let count = 0;
    for (const notif of this.notifications.values()) {
      if (notif.recipientCubId === recipientCubId && !notif.isRead && notif.deliveryState !== 'DISMISSED') {
        count++;
      }
    }
    return count;
  }

  // --- PREFERENCES ---

  public async savePreferences(prefs: NotificationPreferences): Promise<void> {
    this.preferences.set(prefs.cubId, Object.freeze({ ...prefs }));
  }

  public async getPreferences(cubId: string): Promise<NotificationPreferences | undefined> {
    return this.preferences.get(cubId);
  }

  // --- DELIVERY ATTEMPTS ---

  public async recordDeliveryAttempt(attempt: DeliveryAttemptRecord): Promise<void> {
    const list = this.attempts.get(attempt.notificationId) || [];
    list.push(Object.freeze({ ...attempt }));
    this.attempts.set(attempt.notificationId, list);
  }

  public async getDeliveryAttempts(notificationId: string): Promise<readonly DeliveryAttemptRecord[]> {
    return Object.freeze(this.attempts.get(notificationId) || []);
  }
}
