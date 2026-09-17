/**
 * 3D Memory Studio - Funnel 9: Signature & Hash Types
 * 
 * Defines signature format representations and comparison contracts.
 */

import { CanonicalComposite } from './canonical';

/**
 * Result of comparing two canonical composites
 */
export interface CanonicalComparisonResult {
  readonly areEqual: boolean;
  readonly reason?: string;
  readonly differenceType?:
    | 'NONE'
    | 'CHILD_COUNT_MISMATCH'
    | 'DICT_ID_MISMATCH'
    | 'OFFSET_MISMATCH'
    | 'ORDER_MISMATCH'
    | 'TRANSFORM_MISMATCH'
    | 'METADATA_MISMATCH';
  readonly differingChildIndex?: number;
}

/**
 * Serialized Canonical Representation (Intermediate format)
 */
export interface SerializedCanonicalString {
  readonly version: string;
  readonly signature: string;
  readonly canonicalJson: string;
  readonly fingerprint: string;
}

/**
 * Lookup Accelerator Entry (Hash index with collision safety)
 */
export interface CanonicalLookupEntry {
  readonly fingerprint: string;
  readonly canonical: CanonicalComposite;
}
