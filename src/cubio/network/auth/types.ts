/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: CubiO Authentication (Types & Interfaces)
 *
 * Formal specification for authentication requests, verified subjects,
 * cryptographic sessions, token structures, and audit events.
 *
 * ARCHITECTURAL INVARIANT:
 * - NET-02 authenticates: "Who authenticated?"
 * - NET-01 identifies: "Which sovereign CUB-XXXXXXXX entity is this?"
 * - NET-00 locates: "Where is this entity reachable?"
 * - NET-03 authorizes: "What is this entity allowed to do?" (Reserved for NET-03)
 */

import { CubiOIdentity } from '../identity/types';

export type AuthenticationProviderType =
  | 'GOOGLE'
  | 'CUBIO_NATIVE'
  | 'PASSKEY'
  | 'WEB3'
  | string;

export type AuthenticationMethod =
  | 'OAUTH_ID_TOKEN'
  | 'PASSWORD'
  | 'CHALLENGE_RESPONSE'
  | 'FIDO2_PASSKEY'
  | 'WALLET_SIGNATURE'
  | string;

export interface AuthenticatedSubject {
  readonly provider: AuthenticationProviderType;
  readonly subjectId: string; // e.g. Google sub ID, Native username, Wallet public key
  readonly verified: boolean;
  readonly authenticationMethod: AuthenticationMethod;
  readonly authenticatedAt: number;
  readonly email?: string;
  readonly displayName?: string;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface AuthenticationRequest {
  readonly provider: AuthenticationProviderType;
  readonly payload: Readonly<Record<string, any>>;
  readonly clientMetadata?: {
    readonly ipAddress?: string;
    readonly userAgent?: string;
    readonly deviceId?: string;
  };
}

export type AuthSessionStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface AuthSession {
  readonly sessionId: string;
  readonly cubId: string; // Sovereign NET-01 Identity ID
  readonly provider: AuthenticationProviderType;
  readonly subjectId: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly status: AuthSessionStatus;
  readonly refreshedAt?: number;
  readonly clientMetadata?: Readonly<Record<string, any>>;
}

export interface CubiOAuthToken {
  readonly token: string;
  readonly sessionId: string;
  readonly cubId: string;
  readonly provider: AuthenticationProviderType;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly tokenSignature: string;
}

export interface AuthenticationResult {
  readonly success: boolean;
  readonly subject?: AuthenticatedSubject;
  readonly cubId?: string;
  readonly identity?: CubiOIdentity;
  readonly session?: AuthSession;
  readonly sessionToken?: CubiOAuthToken;
  readonly coordinateUri?: string;
  readonly error?: string;
  readonly errorCode?: string;
}

export type AuthEventType =
  | 'AUTH_STARTED'
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'SESSION_CREATED'
  | 'SESSION_VERIFIED'
  | 'SESSION_REFRESHED'
  | 'SESSION_REVOKED'
  | 'LOGOUT'
  | 'PROVIDER_LINKED'
  | 'AUTH_RATE_LIMITED';

export interface AuthEvent {
  readonly eventId: string;
  readonly type: AuthEventType;
  readonly timestamp: number;
  readonly provider?: AuthenticationProviderType;
  readonly cubId?: string;
  readonly subjectId?: string;
  readonly ipAddress?: string;
  readonly details: string;
}

export type RateLimitDimension = 'IP' | 'PROVIDER' | 'SUBJECT' | 'ENDPOINT';

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetTimeMs: number;
  readonly error?: string;
}
