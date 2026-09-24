/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-01: CubiO Identity Types & Interfaces
 *
 * Formal specification for Sovereign CubiO Identities (CUB-XXXXXXXX),
 * multi-provider linkage, device/agent/service bindings, and auditable provenance.
 *
 * IMPORTANT ARCHITECTURAL SEPARATION:
 * - CubiO Identity (NET-01) answers: "WHO or WHAT is this entity?"
 * - CubiO Authentication (NET-02) answers: "CAN this entity prove it owns this identity?"
 * - CubiO Network Coordinate (NET-00) answers: "WHERE is this entity reachable?"
 *
 * Identity formats:
 * Canonical: CUB-XXXXXXXX (e.g. CUB-577000E7)
 */

export type CubiOEntityType = 'USER' | 'DEVICE' | 'AGENT' | 'SERVICE';

export type CubiOIdentityStatus = 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'PROVISIONAL';

export type ExternalProviderType =
  | 'GOOGLE'
  | 'CUBIO_NATIVE'
  | 'PASSKEY'
  | 'WEB3'
  | 'ENTERPRISE_OIDC'
  | string;

export interface ExternalProviderLink {
  readonly provider: ExternalProviderType;
  readonly subjectId: string; // e.g. Google 'sub' claim, or native username
  readonly email?: string;
  readonly displayName?: string;
  readonly linkedAt: number;
  readonly metadata?: Readonly<Record<string, any>>;
}

export type EntityBindingRelation =
  | 'OWNS_DEVICE'
  | 'OPERATES_AGENT'
  | 'HOSTS_SERVICE'
  | 'DELEGATES_TO'
  | 'MEMBER_OF';

export interface EntityBinding {
  readonly targetCubId: string;
  readonly targetType: CubiOEntityType;
  readonly relation: EntityBindingRelation;
  readonly boundAt: number;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface IdentityAuditEvent {
  readonly eventId: string;
  readonly action:
    | 'CREATED'
    | 'PROVIDER_LINKED'
    | 'PROVIDER_UNLINKED'
    | 'BOUND'
    | 'UNBOUND'
    | 'STATUS_CHANGED'
    | 'METADATA_UPDATED';
  readonly timestamp: number;
  readonly details: string;
  readonly performedBy?: string;
}

export interface IdentityProvenance {
  readonly originSource: string; // e.g. 'CUBIO_GENESIS_SEED', 'GOOGLE_OAUTH_PROVISION', 'AGENT_SPAWN'
  readonly canonicalSeedHash: string; // SHA-256 hash of the canonical input seed
  readonly establishedAt: number;
  readonly creatorProvider: ExternalProviderType;
  readonly auditTrail: readonly IdentityAuditEvent[];
}

export interface CubiOIdentity {
  readonly cubId: string; // CUB-XXXXXXXX
  readonly type: CubiOEntityType;
  readonly name: string;
  readonly status: CubiOIdentityStatus;
  readonly createdAt: number;
  readonly provenance: IdentityProvenance;
  readonly providers: readonly ExternalProviderLink[];
  readonly bindings: readonly EntityBinding[];
  readonly metadata: Readonly<Record<string, any>>;
}

export interface IdentityValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export interface IdentityValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly IdentityValidationError[];
  readonly identity?: CubiOIdentity;
}
