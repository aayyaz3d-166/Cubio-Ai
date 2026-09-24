/**
 * CUBiO AI — Task 09: Euler / State-T / Trejetion / Costree Reference Integration
 * src/cubio/core/integratedReferences.ts
 *
 * Implements the Reference Integration Layer for:
 * - Euler: Analytical rotation / phase / orientation derived view
 * - State-T: Authoritative sequential state-transition mechanism
 * - Trejetion: Trajectory / spatial projection / path analysis engine
 * - Costree: Hierarchical / graph analytical representation
 *
 * Core rule:
 *   STORE ONCE
 *   REFERENCE EVERYWHERE
 *   DERIVE ON DEMAND
 *   NEVER DUPLICATE CANONICAL STATE
 *
 * Invariants:
 * 1. VDB remains the sole persistent source of truth.
 * 2. CanonicalIdentity (objectId, tenantId, stateVersion, cellId) is the universal pointer.
 * 3. Spatial mapping adheres exclusively to src/core/address369.ts (cellId = x + 7y + 49z, address369 = 26 + cellId).
 * 4. State-T transitions enforce Optimistic Concurrency Control (OCC) against canonical stateVersion.
 * 5. Euler, Trejetion, and Costree are derived/ephemeral views with bounded LRU caches (<= 256 entries).
 * 6. Eviction never mutates or deletes VDB records.
 * 7. Tenant isolation enforced: mismatched tenantId rejected deterministically.
 * 8. IS_ACTUATION_BLOCKED = true permanently asserted.
 */

import {
  CanonicalIdentityKey,
  calculateCanonicalChecksum,
  createNextVersion,
  isValidCellId,
} from './canonicalIdentity';
import {
  validateCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  coordinateToCellId,
} from '../../core/address369';
import { IS_ACTUATION_BLOCKED } from '../intelligence/core/coreEngineContract';
import { StateTLifecycle } from '../../stateT/StateT';
import { StateTransition } from '../../stateT/StateTransition';
import { ITemporalContext, TemporalContext } from '../../stateT/TemporalContext';

// ── UNIVERSAL CONFLICT ERROR CODES ──────────────────────────────────────────

export const INTEGRATION_ERRORS = {
  STALE_BASE_VERSION: 'STALE_BASE_VERSION',
  TENANT_MISMATCH_CONFLICT: 'TENANT_MISMATCH_CONFLICT',
  ACTUATION_BLOCKED_VIOLATION: 'ACTUATION_BLOCKED_VIOLATION',
  INVALID_SPATIAL_CELL: 'INVALID_SPATIAL_CELL',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
} as const;

// ── UNIVERSAL REFERENCE INTERFACES ──────────────────────────────────────────

export interface DerivedSystemReference {
  readonly objectId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly cellId?: number;
  readonly sourceChecksum: string;
}

// ── 1. EULER REFERENCE MODEL ────────────────────────────────────────────────

export interface EulerViewReference extends DerivedSystemReference {
  readonly viewId: string;
  /** Analytical rotation: [pitch (x), yaw (y), roll (z)] in radians */
  readonly rotation: readonly [number, number, number];
  /** Euler phase angle phi in [0, 2pi) */
  readonly phi: number;
  /** Unit circle invariant: cos^2(phi) + sin^2(phi) */
  readonly norm: number;
  readonly derivedAt: number;
}

// ── 2. STATE-T TRANSITION & OCC MODEL ───────────────────────────────────────

export interface StateTTransitionRequest {
  readonly objectId: string;
  readonly tenantId: string;
  readonly baseStateVersion: number;
  readonly nextLifecycle: StateTLifecycle;
  readonly targetCellId?: number;
  readonly payloadUpdate?: Record<string, unknown>;
  readonly temporalContext?: ITemporalContext;
}

export interface StateTTransitionRecord extends DerivedSystemReference {
  readonly transitionId: string;
  readonly transitionSequence: number;
  readonly baseStateVersion: number;
  readonly resultingStateVersion: number;
  readonly previousLifecycle: StateTLifecycle;
  readonly currentLifecycle: StateTLifecycle;
  readonly transitionedAt: number;
  readonly transitionHash: string;
}

// ── 3. TREJETION REFERENCE MODEL ────────────────────────────────────────────

export interface TrejetionReference extends DerivedSystemReference {
  readonly trajectoryId: string;
  readonly baseStateVersion: number;
  /** Path represented as ordered sequence of canonical cellIds */
  readonly cellIds: readonly number[];
  readonly pathLength: number;
  readonly displacement: number;
  readonly derivedAt: number;
  readonly trajectoryHash: string;
}

// ── 4. COSTREE REFERENCE MODEL ──────────────────────────────────────────────

export interface CostreeNodeReference extends DerivedSystemReference {
  readonly nodeId: string;
  readonly parentNodeId: string | null;
  readonly childNodeIds: readonly string[];
  readonly depth: number;
  readonly branchIndex: number;
  readonly derivedAt: number;
  readonly nodeHash: string;
}

export interface CostreeGraphReference {
  readonly graphId: string;
  readonly rootNodeId: string;
  readonly totalNodes: number;
  readonly maxDepth: number;
  readonly baseStateVersion: number;
  readonly nodeReferences: ReadonlyMap<string, CostreeNodeReference>;
  readonly derivedAt: number;
  readonly graphHash: string;
}

// ── 5. INTEGRATED REFERENCE ENGINE ──────────────────────────────────────────

export class IntegratedReferenceEngine {
  public static readonly DEFAULT_MAX_CACHE_ENTRIES = 256;
  public readonly maxCacheEntries: number;

  // Bounded LRU caches
  private readonly eulerCache: Map<string, { view: EulerViewReference; lastAccessedAt: number }> = new Map();
  private readonly trejetionCache: Map<string, { view: TrejetionReference; lastAccessedAt: number }> = new Map();
  private readonly costreeCache: Map<string, { view: CostreeGraphReference; lastAccessedAt: number }> = new Map();

  // State-T runtime transition sequence counter & bounded transition history
  private transitionSequenceCounter: number = 0;
  private readonly stateTHistory: Map<string, StateTTransitionRecord[]> = new Map();

  constructor(maxCacheEntries: number = IntegratedReferenceEngine.DEFAULT_MAX_CACHE_ENTRIES) {
    this.maxCacheEntries = Math.max(1, maxCacheEntries);
  }

  public static verifyActuationLock(): void {
    if (IS_ACTUATION_BLOCKED !== true) {
      throw new Error(INTEGRATION_ERRORS.ACTUATION_BLOCKED_VIOLATION);
    }
  }

  // --------------------------------------------------------------------------
  // EULER INTEGRATION
  // --------------------------------------------------------------------------

  /**
   * Lazily computes an Euler orientation / phase derived view from canonical reference.
   * Zero payload duplication: stores only reference keys + analytical rotation.
   */
  public deriveEulerView(
    canonical: { readonly identity: CanonicalIdentityKey; readonly payload?: Record<string, unknown> }
  ): EulerViewReference {
    IntegratedReferenceEngine.verifyActuationLock();

    const identity = canonical.identity;
    const cacheKey = `${identity.tenantId}:${identity.objectId}:${identity.stateVersion}:${identity.checksum}`;

    const cached = this.eulerCache.get(cacheKey);
    if (cached) {
      cached.lastAccessedAt = Date.now();
      return cached.view;
    }

    // Derive Euler angle phi and 3D rotation strictly using canonical coordinates
    let phi = 0.0;
    let rotX = 0.0;
    let rotY = 0.0;
    let rotZ = 0.0;

    if (identity.cellId !== undefined) {
      validateCellId(identity.cellId);
      const coord = cellIdToCoordinate(identity.cellId);
      phi = ((coord.x + coord.y + coord.z) * (Math.PI / 10.5)) % (2 * Math.PI);
      rotX = (coord.x / 6.0) * Math.PI;
      rotY = (coord.y / 6.0) * Math.PI;
      rotZ = (coord.z / 6.0) * Math.PI;
    } else {
      phi = 0.0;
    }

    const norm = Math.cos(phi) * Math.cos(phi) + Math.sin(phi) * Math.sin(phi);
    const now = Date.now();

    const view: EulerViewReference = Object.freeze({
      viewId: `EULER:${identity.objectId}:V${identity.stateVersion}`,
      objectId: identity.objectId,
      tenantId: identity.tenantId,
      stateVersion: identity.stateVersion,
      ...(identity.cellId !== undefined ? { cellId: identity.cellId } : {}),
      sourceChecksum: identity.checksum,
      rotation: Object.freeze([
        parseFloat(rotX.toFixed(6)),
        parseFloat(rotY.toFixed(6)),
        parseFloat(rotZ.toFixed(6)),
      ]) as readonly [number, number, number],
      phi: parseFloat(phi.toFixed(6)),
      norm: parseFloat(norm.toFixed(6)),
      derivedAt: now,
    });

    this.putEulerCache(cacheKey, view);
    return view;
  }

  // --------------------------------------------------------------------------
  // STATE-T TRANSITION & OCC INTEGRATION
  // --------------------------------------------------------------------------

  /**
   * Executes an authoritative State-T sequential state transition.
   * Enforces:
   * - Optimistic Concurrency Control (OCC): baseStateVersion === currentCanonical.identity.stateVersion
   * - Tenant isolation: request.tenantId === currentCanonical.identity.tenantId
   * - Strict monotonic increment of canonical stateVersion: nextVersion = baseStateVersion + 1
   * - Distinct runtime transition sequence counter
   * - Returns next canonical identity without creating a second persistent database
   */
  public executeStateTTransition(
    currentCanonical: {
      readonly identity: CanonicalIdentityKey;
      readonly currentLifecycle: StateTLifecycle;
      readonly payload: Record<string, unknown>;
    },
    request: StateTTransitionRequest
  ): {
    readonly nextCanonicalIdentity: CanonicalIdentityKey;
    readonly nextPayload: Record<string, unknown>;
    readonly transitionRecord: StateTTransitionRecord;
  } {
    IntegratedReferenceEngine.verifyActuationLock();

    // Tenant Isolation Check
    if (request.tenantId !== currentCanonical.identity.tenantId) {
      throw new Error(
        `${INTEGRATION_ERRORS.TENANT_MISMATCH_CONFLICT}: Request tenant "${request.tenantId}" does not match canonical tenant "${currentCanonical.identity.tenantId}".`
      );
    }

    // OCC Check: Reject stale base versions
    if (request.baseStateVersion !== currentCanonical.identity.stateVersion) {
      throw new Error(
        `${INTEGRATION_ERRORS.STALE_BASE_VERSION}: Base version mismatch. Request base: ${request.baseStateVersion}, Canonical current: ${currentCanonical.identity.stateVersion}.`
      );
    }

    // Validate lifecycle progression
    if (!StateTransition.isValidTransition(currentCanonical.currentLifecycle, request.nextLifecycle)) {
      throw new Error(
        `${INTEGRATION_ERRORS.INVALID_STATE_TRANSITION}: Illegal transition from ${currentCanonical.currentLifecycle} to ${request.nextLifecycle}.`
      );
    }

    // Spatial validation
    if (request.targetCellId !== undefined) {
      validateCellId(request.targetCellId);
    }

    // Produce next canonical payload
    const nextPayload: Record<string, unknown> = {
      ...currentCanonical.payload,
      ...(request.payloadUpdate || {}),
      lifecycleState: request.nextLifecycle,
      transitionedAt: Date.now(),
    };

    // Canonical version bump via Task 04 createNextVersion
    const nextCanonicalIdentity = createNextVersion(currentCanonical.identity, {
      newPayload: nextPayload,
      newCellId: request.targetCellId,
    });

    // Record transition history
    this.transitionSequenceCounter++;
    const now = Date.now();
    const transitionHash = calculateCanonicalChecksum({
      objectId: currentCanonical.identity.objectId,
      transitionSeq: this.transitionSequenceCounter,
      fromVersion: currentCanonical.identity.stateVersion,
      toVersion: nextCanonicalIdentity.stateVersion,
      fromState: currentCanonical.currentLifecycle,
      toState: request.nextLifecycle,
      timestamp: now,
    });

    const record: StateTTransitionRecord = Object.freeze({
      transitionId: `ST_TX:${currentCanonical.identity.objectId}:${this.transitionSequenceCounter}`,
      transitionSequence: this.transitionSequenceCounter,
      objectId: currentCanonical.identity.objectId,
      tenantId: currentCanonical.identity.tenantId,
      stateVersion: nextCanonicalIdentity.stateVersion,
      baseStateVersion: currentCanonical.identity.stateVersion,
      resultingStateVersion: nextCanonicalIdentity.stateVersion,
      previousLifecycle: currentCanonical.currentLifecycle,
      currentLifecycle: request.nextLifecycle,
      ...(nextCanonicalIdentity.cellId !== undefined ? { cellId: nextCanonicalIdentity.cellId } : {}),
      sourceChecksum: nextCanonicalIdentity.checksum,
      transitionedAt: now,
      transitionHash,
    });

    // Append to bounded runtime history for object
    const history = this.stateTHistory.get(currentCanonical.identity.objectId) || [];
    if (history.length >= this.maxCacheEntries) {
      history.shift(); // Evict oldest runtime transition log
    }
    history.push(record);
    this.stateTHistory.set(currentCanonical.identity.objectId, history);

    return {
      nextCanonicalIdentity,
      nextPayload,
      transitionRecord: record,
    };
  }

  // --------------------------------------------------------------------------
  // TREJETION INTEGRATION
  // --------------------------------------------------------------------------

  /**
   * Derives a Trejetion trajectory reference from canonical object and cell sequence.
   * References cellId[] and derives coordinates via address369.ts without duplicating XYZ arrays.
   */
  public deriveTrejetionReference(
    canonical: { readonly identity: CanonicalIdentityKey },
    cellSequence: readonly number[]
  ): TrejetionReference {
    IntegratedReferenceEngine.verifyActuationLock();

    const identity = canonical.identity;
    const cacheKey = `${identity.tenantId}:${identity.objectId}:${identity.stateVersion}:${cellSequence.join('-')}`;

    const cached = this.trejetionCache.get(cacheKey);
    if (cached) {
      cached.lastAccessedAt = Date.now();
      return cached.view;
    }

    if (cellSequence.length === 0) {
      throw new Error('Trejetion trajectory requires at least one cell.');
    }

    // Validate every cell through canonical address369.ts
    let totalPathLength = 0;
    for (let i = 0; i < cellSequence.length; i++) {
      validateCellId(cellSequence[i]);
      if (i > 0) {
        const cPrev = cellIdToCoordinate(cellSequence[i - 1]);
        const cCurr = cellIdToCoordinate(cellSequence[i]);
        const dx = cCurr.x - cPrev.x;
        const dy = cCurr.y - cPrev.y;
        const dz = cCurr.z - cPrev.z;
        totalPathLength += Math.sqrt(dx * dx + dy * dy + dz * dz);
      }
    }

    const startCoord = cellIdToCoordinate(cellSequence[0]);
    const endCoord = cellIdToCoordinate(cellSequence[cellSequence.length - 1]);
    const dx = endCoord.x - startCoord.x;
    const dy = endCoord.y - startCoord.y;
    const dz = endCoord.z - startCoord.z;
    const displacement = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const now = Date.now();
    const trajectoryHash = calculateCanonicalChecksum({
      objectId: identity.objectId,
      stateVersion: identity.stateVersion,
      cellSequence,
    });

    const view: TrejetionReference = Object.freeze({
      trajectoryId: `TREJ:${identity.objectId}:V${identity.stateVersion}`,
      objectId: identity.objectId,
      tenantId: identity.tenantId,
      stateVersion: identity.stateVersion,
      baseStateVersion: identity.stateVersion,
      cellId: cellSequence[0],
      cellIds: Object.freeze([...cellSequence]),
      pathLength: parseFloat(totalPathLength.toFixed(4)),
      displacement: parseFloat(displacement.toFixed(4)),
      sourceChecksum: identity.checksum,
      derivedAt: now,
      trajectoryHash,
    });

    this.putTrejetionCache(cacheKey, view);
    return view;
  }

  // --------------------------------------------------------------------------
  // COSTREE INTEGRATION
  // --------------------------------------------------------------------------

  /**
   * Derives a Costree hierarchical graph analytical view referencing canonical objects.
   * Nodes store canonical references and cellIds rather than embedded payloads.
   */
  public deriveCostreeGraph(
    rootCanonical: { readonly identity: CanonicalIdentityKey },
    hierarchyDefinition: {
      maxDepth: number;
      branchingFactor: number;
    }
  ): CostreeGraphReference {
    IntegratedReferenceEngine.verifyActuationLock();

    const identity = rootCanonical.identity;
    const cacheKey = `${identity.tenantId}:${identity.objectId}:${identity.stateVersion}:${hierarchyDefinition.maxDepth}:${hierarchyDefinition.branchingFactor}`;

    const cached = this.costreeCache.get(cacheKey);
    if (cached) {
      cached.lastAccessedAt = Date.now();
      return cached.view;
    }

    const nodeMap = new Map<string, CostreeNodeReference>();
    const rootNodeId = `CN-ROOT-${identity.objectId}`;

    // Root node references canonical identity
    const rootNode: CostreeNodeReference = Object.freeze({
      nodeId: rootNodeId,
      objectId: identity.objectId,
      tenantId: identity.tenantId,
      stateVersion: identity.stateVersion,
      parentNodeId: null,
      childNodeIds: [],
      depth: 0,
      branchIndex: 0,
      ...(identity.cellId !== undefined ? { cellId: identity.cellId } : {}),
      sourceChecksum: identity.checksum,
      derivedAt: Date.now(),
      nodeHash: calculateCanonicalChecksum({ id: rootNodeId, depth: 0 }),
    });
    nodeMap.set(rootNodeId, rootNode);

    // Build deterministic child references based on canonical coordinates
    let currentLevelNodes = [rootNodeId];
    for (let d = 1; d <= hierarchyDefinition.maxDepth; d++) {
      const nextLevelNodes: string[] = [];
      for (const parentId of currentLevelNodes) {
        const parent = nodeMap.get(parentId)!;
        const childIds: string[] = [];

        for (let b = 0; b < hierarchyDefinition.branchingFactor; b++) {
          const childId = `CN-D${d}-B${b}-${parentId}`;
          childIds.push(childId);
          nextLevelNodes.push(childId);

          // Canonical cell derived via address369 coordinates if root had cellId
          let childCellId: number | undefined;
          if (parent.cellId !== undefined) {
            const pCoord = cellIdToCoordinate(parent.cellId);
            const cx = (pCoord.x + b + 1) % 7;
            const cy = (pCoord.y + d) % 7;
            const cz = pCoord.z;
            childCellId = coordinateToCellId(cx, cy, cz);
          }

          const childNode: CostreeNodeReference = Object.freeze({
            nodeId: childId,
            objectId: `${identity.objectId}::sub_${d}_${b}`,
            tenantId: identity.tenantId,
            stateVersion: identity.stateVersion,
            parentNodeId: parentId,
            childNodeIds: [],
            depth: d,
            branchIndex: b,
            ...(childCellId !== undefined ? { cellId: childCellId } : {}),
            sourceChecksum: identity.checksum,
            derivedAt: Date.now(),
            nodeHash: calculateCanonicalChecksum({ id: childId, depth: d, parentId }),
          });

          nodeMap.set(childId, childNode);
        }

        // Update parent with its children
        const updatedParent: CostreeNodeReference = Object.freeze({
          ...parent,
          childNodeIds: Object.freeze(childIds),
        });
        nodeMap.set(parentId, updatedParent);
      }
      currentLevelNodes = nextLevelNodes;
    }

    const graphHash = calculateCanonicalChecksum({
      rootId: rootNodeId,
      totalNodes: nodeMap.size,
      maxDepth: hierarchyDefinition.maxDepth,
      baseVersion: identity.stateVersion,
    });

    const graphView: CostreeGraphReference = Object.freeze({
      graphId: `COSTREE:${identity.objectId}:V${identity.stateVersion}`,
      rootNodeId,
      totalNodes: nodeMap.size,
      maxDepth: hierarchyDefinition.maxDepth,
      baseStateVersion: identity.stateVersion,
      nodeReferences: Object.freeze(nodeMap),
      derivedAt: Date.now(),
      graphHash,
    });

    this.putCostreeCache(cacheKey, graphView);
    return graphView;
  }

  // --------------------------------------------------------------------------
  // BOUNDED LRU CACHE & EVICTION
  // --------------------------------------------------------------------------

  private putEulerCache(key: string, view: EulerViewReference): void {
    if (this.eulerCache.size >= this.maxCacheEntries && !this.eulerCache.has(key)) {
      this.evictOldest(this.eulerCache);
    }
    this.eulerCache.set(key, { view, lastAccessedAt: Date.now() });
  }

  private putTrejetionCache(key: string, view: TrejetionReference): void {
    if (this.trejetionCache.size >= this.maxCacheEntries && !this.trejetionCache.has(key)) {
      this.evictOldest(this.trejetionCache);
    }
    this.trejetionCache.set(key, { view, lastAccessedAt: Date.now() });
  }

  private putCostreeCache(key: string, view: CostreeGraphReference): void {
    if (this.costreeCache.size >= this.maxCacheEntries && !this.costreeCache.has(key)) {
      this.evictOldest(this.costreeCache);
    }
    this.costreeCache.set(key, { view, lastAccessedAt: Date.now() });
  }

  private evictOldest<T extends { lastAccessedAt: number }>(cache: Map<string, T>): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [k, v] of cache.entries()) {
      if (v.lastAccessedAt < oldestTime) {
        oldestTime = v.lastAccessedAt;
        oldestKey = k;
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  public getEulerCacheSize(): number {
    return this.eulerCache.size;
  }

  public getTrejetionCacheSize(): number {
    return this.trejetionCache.size;
  }

  public getCostreeCacheSize(): number {
    return this.costreeCache.size;
  }

  public getStateTHistoryCount(objectId: string): number {
    return (this.stateTHistory.get(objectId) || []).length;
  }

  public clearAllCaches(): void {
    this.eulerCache.clear();
    this.trejetionCache.clear();
    this.costreeCache.clear();
  }
}
