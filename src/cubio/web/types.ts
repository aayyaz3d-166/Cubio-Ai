/**
 * CUBiO AI — Phase 11: CUBiO AI Web Studio Types
 * src/cubio/web/types.ts
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'submitting' | 'processing' | 'success' | 'error';

export interface ChatMessage {
  readonly id: string; // turnId or temporary local id
  readonly requestId: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly timestamp: number;
  readonly status: MessageStatus;
  readonly sequence?: number;
  readonly confidence?: number;
  readonly epistemicState?: string;
  readonly latencyMs?: number;
  readonly error?: string;
}

export interface ConversationSummary {
  readonly id: string; // conversationId
  readonly title: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly turnCount: number;
  readonly lastMessageSnippet?: string;
}

export interface UserAuthSession {
  readonly token: string;
  readonly keyId: string;
  readonly role: 'admin' | 'user' | 'readonly';
  readonly tenantId: string;
  readonly userId: string;
  readonly isAuthenticated: boolean;
}

export interface SystemModelStatus {
  readonly model: string;
  readonly version: string;
  readonly parameters: number;
  readonly capability: string;
  readonly productionMode: string;
  readonly neuralPrimary: string;
  readonly isActuationBlocked: boolean;
  readonly isOfflineIsolated: boolean;
}

export interface SystemReadiness {
  readonly status: 'ready' | 'not_ready';
  readonly uptime: number;
  readonly checks: Record<string, 'PASS' | 'FAIL'>;
}

export interface AccountInfo {
  readonly tenantId: string;
  readonly primaryUserId: string;
  readonly name: string;
  readonly status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  readonly createdAt: string;
}

export interface SubscriptionInfo {
  readonly subscriptionId: string;
  readonly planId: string;
  readonly status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'SUSPENDED';
  readonly currentPeriodStart: string;
  readonly currentPeriodEnd: string;
  readonly cancelAtPeriodEnd: boolean;
  readonly providerSubscriptionId?: string;
}

export interface PlanInfo {
  readonly planId: string;
  readonly displayName: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly interval: string;
  readonly limits: {
    readonly maxRequestsPerPeriod: number;
    readonly maxTurnsPerPeriod: number;
    readonly maxMessageLength: number;
    readonly maxConcurrentRequests: number;
  };
  readonly entitlements: readonly string[];
}

export interface UsageSnapshotInfo {
  readonly tenantId: string;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly requestCount: number;
  readonly turnCount: number;
  readonly totalCharacters: number;
  readonly maxRequests: number;
  readonly maxTurns: number;
  readonly remainingRequests: number;
  readonly percentUsed: number;
}

export interface AccountResponse {
  readonly account: AccountInfo;
  readonly subscription: SubscriptionInfo;
  readonly plan: PlanInfo | null;
  readonly usage: UsageSnapshotInfo;
  readonly timestamp: string;
}

export type StudioActiveModal = 'none' | 'auth' | 'settings' | 'usage' | 'spatial' | 'account';
