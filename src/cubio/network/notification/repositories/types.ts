/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-09: Notification Repository Interfaces
 */

import {
  NotificationRecord,
  NotificationPreferences,
  DeliveryAttemptRecord,
  NotificationDeliveryState,
  NotificationQueryOptions,
} from '../types';

export interface INotificationRepository {
  // Notifications
  saveNotification(notification: NotificationRecord): Promise<void>;
  getNotification(notificationId: string): Promise<NotificationRecord | undefined>;
  getNotificationsByRecipient(recipientCubId: string, options?: NotificationQueryOptions): Promise<readonly NotificationRecord[]>;
  updateNotificationState(notificationId: string, state: NotificationDeliveryState, extra?: Partial<NotificationRecord>): Promise<NotificationRecord | undefined>;
  deleteNotification(notificationId: string): Promise<boolean>;
  getUnreadCount(recipientCubId: string): Promise<number>;

  // Preferences
  savePreferences(prefs: NotificationPreferences): Promise<void>;
  getPreferences(cubId: string): Promise<NotificationPreferences | undefined>;

  // Delivery Attempts
  recordDeliveryAttempt(attempt: DeliveryAttemptRecord): Promise<void>;
  getDeliveryAttempts(notificationId: string): Promise<readonly DeliveryAttemptRecord[]>;
}
