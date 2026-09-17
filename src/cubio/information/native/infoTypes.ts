/**
 * CUBiO AI — Task 31: Native Information Representation Layer
 * Phase 3 — Information Intelligence
 * src/cubio/information/native/infoTypes.ts
 *
 * Universal canonical data model for native information representation.
 * Unifies raw multi-modal information payloads with Phase 1 deterministic mathematical states
 * and Phase 2 sparse memory references.
 */

import { CanonicalDomain } from '../../core/canonicalIdentity';
import { StateMemoryBinding } from '../../memory/native/stateBridge/stateBridgeTypes';
import { MemoryIndexReference } from '../../memory/native/indexTypes';

/** Supported information modalities */
export type InformationModality = 'TEXT' | 'NUMERIC' | 'CATEGORICAL' | 'STRUCTURED';

/** Primitive value types allowed in structured information fields */
export type NativeInformationPrimitive =
  | string
  | number
  | boolean
  | null
  | readonly NativeInformationPrimitive[]
  | { readonly [key: string]: NativeInformationPrimitive };

/** Text information payload */
export interface NativeTextPayload {
  readonly modality: 'TEXT';
  /** Bounded UTF-8 text string */
  readonly content: string;
  /** Character length */
  readonly charCount: number;
  /** Character encoding (strictly utf-8) */
  readonly encoding: 'utf-8';
  /** Optional language classification tag */
  readonly language?: string;
  /** Optional estimated token/word count */
  readonly tokensCount?: number;
}

/** Numeric kind classification */
export type NumericKind = 'SCALAR' | 'VECTOR' | 'TENSOR';

/** Numeric information payload */
export interface NativeNumericPayload {
  readonly modality: 'NUMERIC';
  /** Numeric dimensionality structure */
  readonly kind: NumericKind;
  /** Finite numerical value, vector, or 2D matrix */
  readonly value: number | readonly number[] | readonly (readonly number[])[];
  /** Optional lower bound */
  readonly min?: number;
  /** Optional upper bound */
  readonly max?: number;
  /** Optional physical or metric unit */
  readonly unit?: string;
  /** Dimensionality signature (e.g. [3] or [7, 7]) */
  readonly shape: readonly number[];
}

/** Categorical information payload */
export interface NativeCategoricalPayload {
  readonly modality: 'CATEGORICAL';
  /** Category taxonomy name */
  readonly category: string;
  /** Label/class assignment */
  readonly label: string;
  /** Optional confidence score bounded in [0.0, 1.0] */
  readonly confidence?: number;
  /** Optional canonical vocabulary identifier */
  readonly vocabularyId?: string;
  /** Optional categorical attributes */
  readonly attributes?: Readonly<Record<string, string | number | boolean>>;
}

/** Structured record information payload */
export interface NativeStructuredPayload {
  readonly modality: 'STRUCTURED';
  /** Optional schema URI defining structure contract */
  readonly schemaUri?: string;
  /** Strongly validated key-value fields */
  readonly fields: Readonly<Record<string, NativeInformationPrimitive>>;
}

/** Union of all canonical information payload representations */
export type InformationPayload =
  | NativeTextPayload
  | NativeNumericPayload
  | NativeCategoricalPayload
  | NativeStructuredPayload;

/** Universal canonical identity specification for an information entity */
export interface CanonicalInformationIdentity {
  /** Universal object identifier */
  readonly objectId: string;
  /** Tenant isolation namespace */
  readonly tenantId: string;
  /** Canonical persistent storage key: ${tenantId}:${objectId} */
  readonly storageKey: string;
  /** Architectural domain */
  readonly domain: CanonicalDomain;
  /** Monotonic state version (strictly >= 1) */
  readonly stateVersion: number;
  /** Cryptographic SHA-256 digest of identity + canonical payload */
  readonly checksum: string;
  /** Content-addressable SHA-256 hash of the payload itself (used for deduplication) */
  readonly contentHash: string;
  /** Optional parent checksum for monotonic update lineage tracking */
  readonly parentChecksum?: string;
}

/**
 * Sovereign Native Information Object
 * Immutable-by-default, cryptographically verifiable representation of information.
 */
export interface NativeInformationObject {
  readonly mathType: 'NATIVE_INFORMATION_OBJECT';
  /** Universal canonical identity */
  readonly identity: CanonicalInformationIdentity;
  /** Modality classifier */
  readonly modality: InformationModality;
  /** Typed information payload */
  readonly payload: InformationPayload;
  /** Bidirectional binding to underlying Phase 1 state & Phase 2 memory */
  readonly stateBinding?: StateMemoryBinding;
  /** Optional lightweight reference pointer from memory index */
  readonly indexReference?: MemoryIndexReference;
  /** Creation and mutation timestamps */
  readonly timestamps: {
    readonly createdAt: number;
    readonly updatedAt: number;
  };
  /** Informational user-defined metadata tags and key-values */
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

/** Lightweight reference pointer to duplicate or canonical information */
export interface InformationReference {
  readonly objectId: string;
  readonly tenantId: string;
  readonly storageKey: string;
  readonly contentHash: string;
  readonly checksum: string;
  readonly isAlias: boolean;
  readonly canonicalObjectId?: string;
}

/** Options for creating a new NativeInformationObject */
export interface CreateInformationOptions {
  readonly objectId: string;
  readonly tenantId?: string;
  readonly domain?: CanonicalDomain;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
  /** Optional spatial lattice cell ID [0..342] */
  readonly cellId?: number;
}
