/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-09: CubiO Notification Network (Types & Models)
 *
 * Formal specification for sovereign notifications, preferences,
 * multi-channel delivery (IN_APP, REALTIME_P2P, EMAIL_OMAIL),
 * retry mechanics, read states, and category filters.
 *
 * ARCHITECTURAL INVARIANT:
 * - Notifications are strictly addressed to sovereign CUB-XXXXXXXX identities (NET-01).
 * - Multi-channel delivery is decoupled from underlying domain services.
 * - Respects recipient preferences, DND modes, and category thresholds.
 * - Integrates with NET-05 P2P messaging and NET-07 OMail post office.
 */

export type NotificationChannel =
  | 'IN_APP'
  | 'REALTIME_P2P'
  | 'EMAIL_OMAIL'
  | 'WEBHOOK';

export type NotificationPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'CRITICAL';

export type NotificationCategory =
  | 'SYSTEM'
  | 'SECURITY'
  | 'MESSAGE'
  | 'MAIL'
  | 'STORAGE'
  | 'BILLING'
  | 'SPACE'
  | 'COLLABORATION';

export type NotificationDeliveryState =
  | 'QUEUED'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'FAILED'
  | 'READ'
  | 'DISMISSED'
  | 'EXPIRED';

export interface DeliveryAttemptRecord {
  readonly attemptId: string; // ATT_...
  readonly notificationId: string;
  readonly channel: NotificationChannel;
  readonly timestamp: number;
  readonly success: boolean;
  readonly error?: string;
}

export interface NotificationRecord {
  readonly notificationId: string; // NOTIF_...
  readonly recipientCubId: string; // Sovereign CUB-XXXXXXXX from NET-01
  readonly senderCubId: string; // Authoritative CUB-XXXXXXXX or "SYSTEM"
  readonly category: NotificationCategory;
  readonly priority: NotificationPriority;
  readonly channels: readonly NotificationChannel[];
  readonly title: string;
  readonly body: string;
  readonly actionUrl?: string;
  readonly targetResourceUri?: string; // CNC coordinate or entity ID
  readonly deliveryState: NotificationDeliveryState;
  readonly deliveryAttempts: number;
  readonly maxRetries: number;
  readonly isRead: boolean;
  readonly readAt?: number;
  readonly dismissedAt?: number;
  readonly expiresAt?: number;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface CategoryPreference {
  readonly enabled: boolean;
  readonly minimumPriority: NotificationPriority;
  readonly channels: readonly NotificationChannel[];
}

export interface NotificationPreferences {
  readonly cubId: string; // Sovereign CUB-XXXXXXXX
  readonly inAppEnabled: boolean;
  readonly realtimeP2PEnabled: boolean;
  readonly emailOMailEnabled: boolean;
  readonly dndMode: boolean;
  readonly quietHoursEnabled: boolean;
  readonly categoryPreferences: Readonly<Record<NotificationCategory, CategoryPreference>>;
  readonly updatedAt: number;
}

export interface CreateNotificationInput {
  readonly recipientCubIdOrAddress: string; // Supports CUB-XXXXXXXX or @omail.com/@cubio.com
  readonly category: NotificationCategory;
  readonly priority?: NotificationPriority; // default: 'NORMAL'
  readonly channels?: readonly NotificationChannel[]; // default: ['IN_APP', 'REALTIME_P2P']
  readonly title: string;
  readonly body: string;
  readonly actionUrl?: string;
  readonly targetResourceUri?: string;
  readonly maxRetries?: number; // default: 3
  readonly ttlMs?: number; // Time-to-live in ms
  readonly metadata?: Record<string, any>;
}

export interface UpdatePreferencesInput {
  readonly inAppEnabled?: boolean;
  readonly realtimeP2PEnabled?: boolean;
  readonly emailOMailEnabled?: boolean;
  readonly dndMode?: boolean;
  readonly quietHoursEnabled?: boolean;
  readonly categoryPreferences?: Partial<Record<NotificationCategory, Partial<CategoryPreference>>>;
}

export interface NotificationQueryOptions {
  readonly category?: NotificationCategory;
  readonly isRead?: boolean;
  readonly priority?: NotificationPriority;
  readonly limit?: number;
  readonly offset?: number;
}
