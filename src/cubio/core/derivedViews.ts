/**
 * CUBiO AI — Task 08: Z1–Z16 + 12D Derived Memory Views
 * src/cubio/core/derivedViews.ts
 *
 * Implements the Derived / Ephemeral Views Layer over Canonical VDB & Canonical Identity:
 *
 *   CANONICAL OBJECT (VDB)
 *         ↓
 *   CANONICAL IDENTITY (CanonicalIdentityKey)
 *         ↓
 *   Z1–Z16 / 12D LAZY DERIVATION
 *         ↓
 *   EPHEMERAL DERIVED VIEW
 *         ↓
 *   BOUNDED LRU CACHE (<= 256)
 *         ↓
 *   EVICTION (Frees RAM without touching canonical VDB)
 *
 * Invariants:
 * 1. Z1–Z16 and 12D views are analytical representations, NOT canonical persistence.
 * 2. Views reference canonical objectId, tenantId, stateVersion, and sourceChecksum.
 * 3. Spatial location uses canonical cellId [0..342] derived via src/core/address369.ts.
 * 4. Zero full canonical payload duplication.
 * 5. Automatic version invalidation: cached views for older stateVersion/checksum are rejected/recomputed.
 * 6. Tenant isolation enforced: view.tenantId === canonicalObject.tenantId.
 * 7. IS_ACTUATION_BLOCKED = true permanently asserted.
 */

import {
  CanonicalIdentityKey,
  calculateCanonicalChecksum,
  isValidCellId,
} from './canonicalIdentity';
import {
  validateCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
} from '../../core/address369';
import { IS_ACTUATION_BLOCKED } from '../intelligence/core/coreEngineContract';
import { extractDigitalRoot, toNormalizedArray } from '../../memory12d/State12DVector';
import { IState12DVector } from '../../memory12d/MemoryTypes';
import { PolarityDirection } from '../../unified/UnifiedTypes';

// ── 1. Z-LAYER DEFINITIONS & STATUS MATRIX ───────────────────────────────────

export type ZLayer =
  | 'Z1'
  | 'Z2'
  | 'Z3'
  | 'Z4'
  | 'Z5'
  | 'Z6'
  | 'Z7'
  | 'Z8'
  | 'Z9'
  | 'Z10'
  | 'Z11'
  | 'Z12'
  | 'Z13'
  | 'Z14'
  | 'Z15'
  | 'Z16';

export const ALL_Z_LAYERS: readonly ZLayer[] = Object.freeze([
  'Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7', 'Z8',
  'Z9', 'Z10', 'Z11', 'Z12', 'Z13', 'Z14', 'Z15', 'Z16'
]);

export type ZLayerRuntimeStatus = 'ACTIVE' | 'EXPERIMENTAL' | 'UNIMPLEMENTED';

export interface ZLayerDescriptor {
  readonly layer: ZLayer;
  readonly dimensionIndex: number;
  readonly status: ZLayerRuntimeStatus;
  readonly description: string;
}

/**
 * Authoritative Z1..Z16 Runtime Matrix based on codebase audit:
 * - Z1..Z3: ACTIVE (Continuous Euclidean spatial coordinates X, Y, Z via address369.ts)
 * - Z4: ACTIVE (Categorical State Phase: SOLID, LIQUID, GAS, etc.)
 * - Z5: ACTIVE (Discrete State-T temporal tick)
 * - Z6: ACTIVE (Discrete Trajectory step)
 * - Z7: ACTIVE (Polarity direction: FORWARD, NEUTRAL, INVERSE)
 * - Z8: ACTIVE (River channel: NONE, PISHON, GIHON, TIGRIS, EUPHRATES)
 * - Z9: ACTIVE (Finite digital root 1..9 from address369)
 * - Z10: ACTIVE (Chemical/environmental state hash normalization)
 * - Z11: ACTIVE (Crystal material state hash normalization)
 * - Z12: ACTIVE (Provenance confidence metric [0.0, 1.0])
 * - Z13..Z16: EXPERIMENTAL / MATHEMATICAL (Higher-dimensional hypercube projections from Funnels 14–16)
 */
export const Z_LAYER_REGISTRY: Readonly<Record<ZLayer, ZLayerDescriptor>> = Object.freeze({
  Z1: { layer: 'Z1', dimensionIndex: 0, status: 'ACTIVE', description: 'Continuous spatial coordinate X in [0..6]' },
  Z2: { layer: 'Z2', dimensionIndex: 1, status: 'ACTIVE', description: 'Continuous spatial coordinate Y in [0..6]' },
  Z3: { layer: 'Z3', dimensionIndex: 2, status: 'ACTIVE', description: 'Continuous spatial coordinate Z in [0..6]' },
  Z4: { layer: 'Z4', dimensionIndex: 3, status: 'ACTIVE', description: 'Categorical state phase mapped to [0..1]' },
  Z5: { layer: 'Z5', dimensionIndex: 4, status: 'ACTIVE', description: 'Discrete State-T temporal tick mapped to [0..1]' },
  Z6: { layer: 'Z6', dimensionIndex: 5, status: 'ACTIVE', description: 'Discrete Trajectory step index mapped to [0..1]' },
  Z7: { layer: 'Z7', dimensionIndex: 6, status: 'ACTIVE', description: 'Discrete polarity direction (-1, 0, +1) mapped to [0..1]' },
  Z8: { layer: 'Z8', dimensionIndex: 7, status: 'ACTIVE', description: 'Categorical river channel mapped to [0..1]' },
  Z9: { layer: 'Z9', dimensionIndex: 8, status: 'ACTIVE', description: 'Finite digital root (1..9) mapped to [0..1]' },
  Z10: { layer: 'Z10', dimensionIndex: 9, status: 'ACTIVE', description: 'Chemical/payload state hash normalized scalar' },
  Z11: { layer: 'Z11', dimensionIndex: 10, status: 'ACTIVE', description: 'Crystal/entropy state hash normalized scalar' },
  Z12: { layer: 'Z12', dimensionIndex: 11, status: 'ACTIVE', description: 'Metadata provenance confidence in [0..1]' },
  Z13: { layer: 'Z13', dimensionIndex: 12, status: 'EXPERIMENTAL', description: 'Harmonic subspace projection (Z13 hyper-axis)' },
  Z14: { layer: 'Z14', dimensionIndex: 13, status: 'EXPERIMENTAL', description: 'Manifold curvature coordinate (Z14 hyper-axis)' },
  Z15: { layer: 'Z15', dimensionIndex: 14, status: 'EXPERIMENTAL', description: 'Confluence gradient projection (Z15 hyper-axis)' },
  Z16: { layer: 'Z16', dimensionIndex: 15, status: 'EXPERIMENTAL', description: 'Canonical closure invariant coordinate (Z16 hyper-axis)' },
});

// ── 2. Z VIEW CONTRACT ───────────────────────────────────────────────────────

export interface ZViewReference {
  readonly viewId: string;
  readonly layer: ZLayer;
  readonly objectId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly cellId?: number;
  readonly derivedScalar: number;
  readonly sourceChecksum: string;
  readonly derivedAt: number;
}

// ── 3. 12D VIEW CONTRACT ────────────────────────────────────────────────────

export interface TwelveDViewReference {
  readonly viewId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly sourceChecksum: string;
  readonly cellId?: number;
  readonly address369?: number;
  /** Exactly 12 normalized continuous scalar dimensions in [0.0, 1.0] */
  readonly dimensions: readonly number[];
  readonly derivedAt: number;
  readonly checksum: string;
}

// ── 4. DERIVED VIEW ENGINE ──────────────────────────────────────────────────

export class DerivedViewEngine {
  public static readonly DEFAULT_MAX_CACHE_ENTRIES = 256;
  public readonly maxCacheEntries: number;

  // Bounded LRU caches for Z views and 12D views
  private readonly zCache: Map<string, { view: ZViewReference; lastAccessedAt: number }> = new Map();
  private readonly twelveDCache: Map<string, { view: TwelveDViewReference; lastAccessedAt: number }> = new Map();

  constructor(maxCacheEntries: number = DerivedViewEngine.DEFAULT_MAX_CACHE_ENTRIES) {
    this.maxCacheEntries = Math.max(1, maxCacheEntries);
  }

  public static verifyActuationLock(): void {
    if (IS_ACTUATION_BLOCKED !== true) {
      throw new Error('SECURITY VIOLATION: IS_ACTUATION_BLOCKED must be true in DerivedViewEngine.');
    }
  }

  /**
   * Lazily derives a specific ZLayer view (Z1..Z16) from a canonical object on demand.
   * Does NOT duplicate or retain full canonical payload.
   */
  public deriveZView(
    canonical: { readonly identity: CanonicalIdentityKey; readonly payload?: Record<string, unknown> },
    layer: ZLayer
  ): ZViewReference {
    DerivedViewEngine.verifyActuationLock();

    const identity = canonical.identity;
    const cacheKey = `${identity.tenantId}:${identity.objectId}:${identity.stateVersion}:${layer}:${identity.checksum}`;

    // Check bounded cache
    const cached = this.zCache.get(cacheKey);
    if (cached) {
      cached.lastAccessedAt = Date.now();
      return cached.view;
    }

    // Derive on demand
    const descriptor = Z_LAYER_REGISTRY[layer];
    if (!descriptor) {
      throw new Error(`Unknown Z-Layer: ${layer}`);
    }

    let derivedScalar = 0.0;
    const payload = canonical.payload || {};

    // Derive spatial coordinates (Z1..Z3) via authoritative address369.ts
    if (identity.cellId !== undefined) {
      validateCellId(identity.cellId);
      const coord = cellIdToCoordinate(identity.cellId);
      if (layer === 'Z1') derivedScalar = coord.x / 6.0; // Normalized 0..6
      else if (layer === 'Z2') derivedScalar = coord.y / 6.0;
      else if (layer === 'Z3') derivedScalar = coord.z / 6.0;
    }

    if (layer === 'Z4') {
      const phase = typeof payload.phase === 'string' ? payload.phase.toUpperCase() : 'SOLID';
      const phases = ['SOLID', 'LIQUID', 'GAS', 'PLASMA', 'SUPERCRITICAL', 'AQUEOUS', 'CRYSTALLINE', 'AMORPHOUS'];
      const idx = phases.indexOf(phase);
      derivedScalar = (idx >= 0 ? idx : 0) / (phases.length - 1);
    } else if (layer === 'Z5') {
      const tick = typeof payload.temporalTick === 'number' ? payload.temporalTick : 0;
      derivedScalar = Math.max(0, Math.min(1.0, tick / 1000.0));
    } else if (layer === 'Z6') {
      const step = typeof payload.trajectoryStep === 'number' ? payload.trajectoryStep : 0;
      derivedScalar = Math.max(0, Math.min(1.0, step / 1000.0));
    } else if (layer === 'Z7') {
      const pol = typeof payload.polarity === 'string' ? payload.polarity : 'FORWARD';
      derivedScalar = pol === 'FORWARD' ? 1.0 : pol === 'INVERSE' ? 0.0 : 0.5;
    } else if (layer === 'Z8') {
      const ch = typeof payload.riverChannel === 'string' ? payload.riverChannel.toUpperCase() : 'NONE';
      const channels = ['NONE', 'PISHON', 'GIHON', 'TIGRIS', 'EUPHRATES'];
      const cIdx = channels.indexOf(ch);
      derivedScalar = (cIdx >= 0 ? cIdx : 0) / (channels.length - 1);
    } else if (layer === 'Z9') {
      if (identity.cellId !== undefined) {
        const addr369 = cellIdToAddress369(identity.cellId);
        const coord = cellIdToCoordinate(identity.cellId);
        derivedScalar = (extractDigitalRoot(addr369.toString(), [coord.x, coord.y, coord.z]) - 1) / 8.0;
      } else {
        derivedScalar = 0.5;
      }
    } else if (layer === 'Z10') {
      const chHash = typeof payload.chemicalHash === 'string' ? payload.chemicalHash : identity.checksum;
      derivedScalar = parseInt(chHash.slice(0, 8), 16) / 0xffffffff;
    } else if (layer === 'Z11') {
      const crHash = typeof payload.crystalHash === 'string' ? payload.crystalHash : identity.checksum;
      derivedScalar = parseInt(crHash.slice(8, 16), 16) / 0xffffffff;
    } else if (layer === 'Z12') {
      const conf = typeof payload.confidence === 'number' ? payload.confidence : 1.0;
      derivedScalar = Math.max(0.0, Math.min(1.0, conf));
    } else if (descriptor.status === 'EXPERIMENTAL') {
      // Experimental harmonic projections (Z13..Z16)
      const subIdx = descriptor.dimensionIndex;
      derivedScalar = parseFloat(((subIdx * 0.0625 + (identity.cellId ?? 0) * 0.001) % 1.0).toFixed(4));
    }

    const now = Date.now();
    const view: ZViewReference = Object.freeze({
      viewId: `Z_VIEW:${layer}:${identity.objectId}:V${identity.stateVersion}`,
      layer,
      objectId: identity.objectId,
      tenantId: identity.tenantId,
      stateVersion: identity.stateVersion,
      ...(identity.cellId !== undefined ? { cellId: identity.cellId } : {}),
      derivedScalar: parseFloat(derivedScalar.toFixed(6)),
      sourceChecksum: identity.checksum,
      derivedAt: now,
    });

    // Save in bounded cache
    this.putZCache(cacheKey, view);
    return view;
  }

  /**
   * Lazily derives a TwelveDViewReference (exactly 12 dimensions) from canonical object.
   * Never stores redundant canonical payloads.
   */
  public derive12DView(
    canonical: { readonly identity: CanonicalIdentityKey; readonly payload?: Record<string, unknown> }
  ): TwelveDViewReference {
    DerivedViewEngine.verifyActuationLock();

    const identity = canonical.identity;
    const cacheKey = `${identity.tenantId}:${identity.objectId}:${identity.stateVersion}:${identity.checksum}`;

    const cached = this.twelveDCache.get(cacheKey);
    if (cached) {
      cached.lastAccessedAt = Date.now();
      return cached.view;
    }

    // Compute exactly 12 normalized dimensions derived from Z1..Z12
    const dims: number[] = [];
    for (let i = 1; i <= 12; i++) {
      const zLayer = `Z${i}` as ZLayer;
      const zView = this.deriveZView(canonical, zLayer);
      dims.push(zView.derivedScalar);
    }

    const address369 = identity.cellId !== undefined ? cellIdToAddress369(identity.cellId) : undefined;
    const now = Date.now();
    const checksum = calculateCanonicalChecksum({
      objectId: identity.objectId,
      tenantId: identity.tenantId,
      stateVersion: identity.stateVersion,
      sourceChecksum: identity.checksum,
      dimensions: dims,
    });

    const view: TwelveDViewReference = Object.freeze({
      viewId: `12D_VIEW:${identity.objectId}:V${identity.stateVersion}`,
      objectId: identity.objectId,
      tenantId: identity.tenantId,
      stateVersion: identity.stateVersion,
      sourceChecksum: identity.checksum,
      ...(identity.cellId !== undefined ? { cellId: identity.cellId } : {}),
      ...(address369 !== undefined ? { address369 } : {}),
      dimensions: Object.freeze(dims),
      derivedAt: now,
      checksum,
    });

    this.putTwelveDCache(cacheKey, view);
    return view;
  }

  /**
   * Resolves a cached 12D view, enforcing version freshness.
   * If the canonical object stateVersion or checksum has advanced, rejects the stale view.
   */
  public resolve12DView(
    currentCanonical: { readonly identity: CanonicalIdentityKey; readonly payload?: Record<string, unknown> }
  ): TwelveDViewReference {
    const identity = currentCanonical.identity;
    const cacheKey = `${identity.tenantId}:${identity.objectId}:${identity.stateVersion}:${identity.checksum}`;

    const cached = this.twelveDCache.get(cacheKey);
    if (cached) {
      if (
        cached.view.stateVersion === identity.stateVersion &&
        cached.view.sourceChecksum === identity.checksum &&
        cached.view.tenantId === identity.tenantId
      ) {
        cached.lastAccessedAt = Date.now();
        return cached.view;
      }
    }

    // Recompute on-demand
    return this.derive12DView(currentCanonical);
  }

  // ── BOUNDED LRU CACHE MANAGEMENT ──────────────────────────────────────────

  private putZCache(key: string, view: ZViewReference): void {
    if (this.zCache.size >= this.maxCacheEntries && !this.zCache.has(key)) {
      this.evictOldest(this.zCache);
    }
    this.zCache.set(key, { view, lastAccessedAt: Date.now() });
  }

  private putTwelveDCache(key: string, view: TwelveDViewReference): void {
    if (this.twelveDCache.size >= this.maxCacheEntries && !this.twelveDCache.has(key)) {
      this.evictOldest(this.twelveDCache);
    }
    this.twelveDCache.set(key, { view, lastAccessedAt: Date.now() });
  }

  private evictOldest<T extends { lastAccessedAt: number }>(cacheMap: Map<string, T>): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [k, v] of cacheMap.entries()) {
      if (v.lastAccessedAt < oldestTime) {
        oldestTime = v.lastAccessedAt;
        oldestKey = k;
      }
    }

    if (oldestKey) {
      cacheMap.delete(oldestKey);
    }
  }

  public getZCacheSize(): number {
    return this.zCache.size;
  }

  public getTwelveDCacheSize(): number {
    return this.twelveDCache.size;
  }

  public clearCaches(): void {
    this.zCache.clear();
    this.twelveDCache.clear();
  }
}
