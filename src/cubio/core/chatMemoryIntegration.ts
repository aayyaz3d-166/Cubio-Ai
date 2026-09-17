/**
 * CUBiO AI ? Task 14: Chat <-> Canonical Memory Integration
 * src/cubio/core/chatMemoryIntegration.ts
 *
 * Core architectural bridge connecting CUBiO Chat to the Canonical Memory / VDB
 * architecture. Chat retrieves and reasons over persistent canonical memory
 * without creating a second database, duplicate memory system, or external LLM dependency.
 *
 * Principles:
 * 1. STORE ONCE -> REFERENCE EVERYWHERE: Chat holds lightweight ChatMemoryReference pointers,
 *    not duplicate copies of complete canonical payloads.
 * 2. VDB IS THE SOLE PERSISTENT TRUTH: Point lookups and targeted queries only. No full DB scans.
 * 3. IDENTITY SEPARATION: sessionId != messageId != turnId != objectId.
 * 4. BOUNDED SESSION MEMORY: L1 cache capped at <= 256 references with deterministic LRU eviction.
 * 5. BOUNDED CONTEXT: Strict limits on memory references, context records, and context bytes.
 * 6. VERSION & TENANT SAFETY: Version refresh on stale references, OCC on writes, cross-tenant fail-closed.
 * 7. SPATIAL AUTHORITY: All spatial derivations use src/core/address369.ts and Formula A.
 * 8. READ-ONLY RETRIEVAL: Queries never silently mutate VDB. Explicit write path governed.
 * 9. ACTUATION LOCK: IS_ACTUATION_BLOCKED === true permanently asserted.
 */

import * as crypto from 'crypto';
import { IS_ACTUATION_BLOCKED } from '../intelligence/core/coreEngineContract';
import {
  calculateCanonicalChecksum,
  CanonicalIdentityKey,
  createCanonicalIdentity,
  deriveSpatialIdentity,
} from './canonicalIdentity';
import {
  validateCellId,
  cellIdToAddress369,
  cellIdToCoordinate,
  coordinateToCellId,
  address369ToCellId,
  TOTAL_SPATIAL_CELLS,
  TOTAL_ADDRESS_SPACE,
} from '../../core/address369';
import { SQLiteDataStore } from '../../funnel71/persistence/sqlitePersistence';
import { StudioRecord } from '../../funnel71/types';

export { IS_ACTUATION_BLOCKED };

// =============================================================================
// ARCHITECTURAL CONSTANTS & CONTEXT BOUNDS
// =============================================================================

export const CHAT_MEMORY_L1_CAPACITY = 256;
export const MAX_MEMORY_REFERENCES = 16;
export const MAX_CONTEXT_RECORDS = 8;
export const MAX_CONTEXT_BYTES = 8192;
export const MAX_SESSION_TURNS = 1000;

// =============================================================================
// DATA CONTRACTS
// =============================================================================

/**
 * Lightweight pointer to a canonical entity in VDB or derived layer.
 * Chat stores this reference instead of deep-cloning full records.
 */
export interface ChatMemoryReference {
  readonly objectId: string;
  readonly tenantId: string;
  readonly stateVersion: number;
  readonly checksum: string;
  readonly cellId?: number;
  readonly domain?: string;
}

/**
 * Resolution outcome of a canonical memory reference.
 */
export interface ChatMemoryResolution {
  readonly reference: ChatMemoryReference;
  readonly resolved: boolean;
  readonly source: 'VDB' | 'DERIVED' | 'SESSION';
  readonly projection?: Record<string, unknown>;
  readonly resolvedAt: number;
}

/**
 * Bounded canonical context projection for Chat reasoning.
 */
export interface ChatCanonicalContext {
  readonly references: readonly ChatMemoryReference[];
  readonly resolvedCount: number;
  readonly contextBytes: number;
  readonly generatedAt: string;
  readonly formattedContext: string;
}

/**
 * Targeted query retrieval outcome.
 */
export interface MemoryRetrievalResult {
  readonly references: readonly ChatMemoryReference[];
  readonly count: number;
}

/**
 * Parameters for an explicit write operation into canonical memory.
 */
export interface ChatExplicitWriteParams {
  readonly tenantId: string;
  readonly objectId: string;
  readonly baseStateVersion: number;
  readonly payload: Record<string, unknown>;
  readonly cellId?: number;
  readonly expectedChecksum?: string;
  readonly source?: string;
}

/**
 * Result of an explicit write operation.
 */
export interface ChatExplicitWriteResult {
  readonly success: boolean;
  readonly reference: ChatMemoryReference;
  readonly previousVersion: number;
  readonly newVersion: number;
}

/**
 * Diagnostic telemetry counters (strictly bounded).
 */
export interface ChatMemoryDiagnostics {
  referencesRequested: number;
  referencesResolved: number;
  cacheHits: number;
  cacheMisses: number;
  staleReferences: number;
  tenantConflicts: number;
  integrityFailures: number;
  contextBytes: number;
  writesCommitted: number;
  occConflicts: number;
}

// =============================================================================
// IDENTITY SEPARATION VALIDATOR
// =============================================================================

/**
 * Strictly verifies that session, message, turn, and object identities are disjoint.
 * sessionId != messageId != turnId != objectId
 */
export function validateIdentitySeparation(params: {
  sessionId: string;
  turnId: string;
  objectId: string;
  messageId?: string;
}): void {
  const { sessionId, turnId, objectId, messageId } = params;

  if (sessionId === objectId) {
    throw new Error(`IDENTITY_COLLISION_ERROR: sessionId (${sessionId}) must not equal objectId (${objectId}).`);
  }
  if (turnId === objectId) {
    throw new Error(`IDENTITY_COLLISION_ERROR: turnId (${turnId}) must not equal objectId (${objectId}).`);
  }
  if (sessionId === turnId) {
    throw new Error(`IDENTITY_COLLISION_ERROR: sessionId (${sessionId}) must not equal turnId (${turnId}).`);
  }
  if (messageId && messageId === objectId) {
    throw new Error(`IDENTITY_COLLISION_ERROR: messageId (${messageId}) must not equal objectId (${objectId}).`);
  }
}

// =============================================================================
// BOUNDED L1 SESSION WORKING CACHE
// =============================================================================

/**
 * Bounded L1 working cache for Chat memory references.
 * - Capped at CHAT_MEMORY_L1_CAPACITY (<= 256 references).
 * - Key format: `${tenantId}:${objectId}:${stateVersion}`.
 * - LRU eviction when capacity is exceeded.
 * - Immediate invalidation of older versions for the same tenant+objectId.
 * - Strict tenant isolation.
 */
export class ChatMemoryL1Cache {
  private readonly entries: Map<string, { resolution: ChatMemoryResolution; lastAccessedAt: number }> = new Map();
  private readonly capacity: number;
  private _evictions = 0;

  constructor(capacity: number = CHAT_MEMORY_L1_CAPACITY) {
    this.capacity = capacity;
  }

  private _key(tenantId: string, objectId: string, stateVersion: number): string {
    return `${tenantId}:${objectId}:${stateVersion}`;
  }

  public get(tenantId: string, objectId: string, stateVersion: number): ChatMemoryResolution | null {
    const key = this._key(tenantId, objectId, stateVersion);
    const item = this.entries.get(key);
    if (!item) return null;

    // Tenant isolation check
    if (item.resolution.reference.tenantId !== tenantId) {
      return null;
    }

    // Version safety check
    if (item.resolution.reference.stateVersion !== stateVersion) {
      this.entries.delete(key);
      this._evictions++;
      return null;
    }

    item.lastAccessedAt = Date.now();
    return item.resolution;
  }

  public set(resolution: ChatMemoryResolution): void {
    const { reference } = resolution;
    const { tenantId, objectId, stateVersion } = reference;

    // Evict any older version entries for this tenant+objectId
    for (const [k, v] of this.entries) {
      if (v.resolution.reference.tenantId === tenantId && v.resolution.reference.objectId === objectId) {
        if (v.resolution.reference.stateVersion !== stateVersion) {
          this.entries.delete(k);
          this._evictions++;
        }
      }
    }

    // Capacity enforcement via LRU eviction
    if (this.entries.size >= this.capacity) {
      this._evictLRU();
    }

    const key = this._key(tenantId, objectId, stateVersion);
    this.entries.set(key, {
      resolution,
      lastAccessedAt: Date.now(),
    });
  }

  public invalidate(tenantId: string, objectId: string): void {
    for (const [k, v] of this.entries) {
      if (v.resolution.reference.tenantId === tenantId && v.resolution.reference.objectId === objectId) {
        this.entries.delete(k);
      }
    }
  }

  public invalidateTenant(tenantId: string): void {
    for (const [k, v] of this.entries) {
      if (v.resolution.reference.tenantId === tenantId) {
        this.entries.delete(k);
      }
    }
  }

  public clear(): void {
    this.entries.clear();
  }

  public get size(): number {
    return this.entries.size;
  }

  public get evictions(): number {
    return this._evictions;
  }

  private _evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [k, v] of this.entries) {
      if (v.lastAccessedAt < oldestTime) {
        oldestTime = v.lastAccessedAt;
        oldestKey = k;
      }
    }

    if (oldestKey) {
      this.entries.delete(oldestKey);
      this._evictions++;
    }
  }
}

// =============================================================================
// CHAT MEMORY INTEGRATION ENGINE
// =============================================================================

export interface ChatMemoryIntegrationOptions {
  store?: SQLiteDataStore;
  cacheCapacity?: number;
  maxContextRecords?: number;
  maxContextBytes?: number;
}

/**
 * Master Chat <-> Canonical Memory Integration Engine.
 */
export class ChatMemoryIntegrationEngine {
  private static instance: ChatMemoryIntegrationEngine | null = null;
  public readonly l1Cache: ChatMemoryL1Cache;
  private readonly store: SQLiteDataStore;
  private readonly maxContextRecords: number;
  private readonly maxContextBytes: number;

  private readonly diagnostics: ChatMemoryDiagnostics = {
    referencesRequested: 0,
    referencesResolved: 0,
    cacheHits: 0,
    cacheMisses: 0,
    staleReferences: 0,
    tenantConflicts: 0,
    integrityFailures: 0,
    contextBytes: 0,
    writesCommitted: 0,
    occConflicts: 0,
  };

  constructor(options?: ChatMemoryIntegrationOptions) {
    // Permanent Actuation Lock Enforcement
    if (IS_ACTUATION_BLOCKED !== true) {
      throw new Error('SECURITY_VIOLATION: IS_ACTUATION_BLOCKED must be true in ChatMemoryIntegrationEngine.');
    }

    this.l1Cache = new ChatMemoryL1Cache(options?.cacheCapacity ?? CHAT_MEMORY_L1_CAPACITY);
    this.store = options?.store ?? new SQLiteDataStore();
    this.maxContextRecords = options?.maxContextRecords ?? MAX_CONTEXT_RECORDS;
    this.maxContextBytes = options?.maxContextBytes ?? MAX_CONTEXT_BYTES;
  }

  public static getInstance(options?: ChatMemoryIntegrationOptions): ChatMemoryIntegrationEngine {
    if (!ChatMemoryIntegrationEngine.instance) {
      ChatMemoryIntegrationEngine.instance = new ChatMemoryIntegrationEngine(options);
    }
    return ChatMemoryIntegrationEngine.instance;
  }

  public static reset(): void {
    ChatMemoryIntegrationEngine.instance = null;
  }

  public getDiagnostics(): Readonly<ChatMemoryDiagnostics> {
    return Object.freeze({ ...this.diagnostics });
  }

  // ???????????????????????????????????????????????????????????????????????????
  // TARGETED RETRIEVAL (NO FULL DB SCANS)
  // ???????????????????????????????????????????????????????????????????????????

  /**
   * Scans the user query for targeted entity patterns (e.g. STATE_001, SPATIAL_MEM_10,
   * URN:CUBIO:..., or coordinates) and returns candidate references WITHOUT full DB scans.
   */
  public extractCandidateReferences(params: {
    query: string;
    tenantId: string;
    spatialCellId?: number;
    spatialCoordinate?: readonly [number, number, number] | [number, number, number];
  }): MemoryRetrievalResult {
    const { query, tenantId, spatialCellId, spatialCoordinate } = params;
    const candidates: ChatMemoryReference[] = [];
    const seenIds = new Set<string>();

    // 1. Explicit spatial options if passed
    if (spatialCellId !== undefined) {
      validateCellId(spatialCellId);
      const objectId = `URN:CUBIO:SPATIAL_MEMORY:SPATIAL_MEM_${spatialCellId}`;
      if (!seenIds.has(objectId)) {
        seenIds.add(objectId);
        candidates.push({
          objectId,
          tenantId,
          stateVersion: 1,
          checksum: '',
          cellId: spatialCellId,
          domain: 'SPATIAL_MEMORY',
        });
      }
    } else if (spatialCoordinate !== undefined) {
      const [x, y, z] = spatialCoordinate;
      const cellId = coordinateToCellId(x, y, z);
      const objectId = `URN:CUBIO:SPATIAL_MEMORY:SPATIAL_MEM_${cellId}`;
      if (!seenIds.has(objectId)) {
        seenIds.add(objectId);
        candidates.push({
          objectId,
          tenantId,
          stateVersion: 1,
          checksum: '',
          cellId,
          domain: 'SPATIAL_MEMORY',
        });
      }
    }

    // 2. Targeted query pattern regexes
    // STATE_xxx pattern
    const stateMatches = query.match(/\bSTATE_(\d{3,4})\b/g);
    if (stateMatches) {
      for (const m of stateMatches) {
        if (candidates.length >= MAX_MEMORY_REFERENCES) break;
        if (!seenIds.has(m)) {
          seenIds.add(m);
          candidates.push({
            objectId: m,
            tenantId,
            stateVersion: 1,
            checksum: '',
            domain: 'STATES',
          });
        }
      }
    }

    // SPATIAL_MEM_xxx pattern
    const spatialMatches = query.match(/\bSPATIAL_MEM_(\d{1,3})\b/g);
    if (spatialMatches) {
      for (const m of spatialMatches) {
        if (candidates.length >= MAX_MEMORY_REFERENCES) break;
        const cellIdNum = parseInt(m.replace('SPATIAL_MEM_', ''), 10);
        if (cellIdNum >= 0 && cellIdNum < TOTAL_SPATIAL_CELLS) {
          const objectId = `URN:CUBIO:SPATIAL_MEMORY:${m}`;
          if (!seenIds.has(objectId)) {
            seenIds.add(objectId);
            candidates.push({
              objectId,
              tenantId,
              stateVersion: 1,
              checksum: '',
              cellId: cellIdNum,
              domain: 'SPATIAL_MEMORY',
            });
          }
        }
      }
    }

    // Explicit URN pattern
    const urnMatches = query.match(/\bURN:CUBIO:[A-Z_]+:[A-Za-z0-9_\-]+\b/g);
    if (urnMatches) {
      for (const u of urnMatches) {
        if (candidates.length >= MAX_MEMORY_REFERENCES) break;
        if (!seenIds.has(u)) {
          seenIds.add(u);
          candidates.push({
            objectId: u,
            tenantId,
            stateVersion: 1,
            checksum: '',
          });
        }
      }
    }

    // Address 369 pattern (e.g. "address 197" or "address369: 197")
    const addrMatches = query.match(/\baddress(?:369)?[:\s]+(\d{2,3})\b/i);
    if (addrMatches && addrMatches[1]) {
      const addr = parseInt(addrMatches[1], 10);
      if (addr >= 26 && addr <= 368 && candidates.length < MAX_MEMORY_REFERENCES) {
        const cellId = address369ToCellId(addr);
        const objectId = `URN:CUBIO:SPATIAL_MEMORY:SPATIAL_MEM_${cellId}`;
        if (!seenIds.has(objectId)) {
          seenIds.add(objectId);
          candidates.push({
            objectId,
            tenantId,
            stateVersion: 1,
            checksum: '',
            cellId,
            domain: 'SPATIAL_MEMORY',
          });
        }
      }
    }

    return Object.freeze({
      references: Object.freeze(candidates),
      count: candidates.length,
    });
  }

  // ???????????????????????????????????????????????????????????????????????????
  // CANONICAL REFERENCE RESOLUTION (VDB POINT LOOKUP)
  // ???????????????????????????????????????????????????????????????????????????

  /**
   * Resolves a single ChatMemoryReference against VDB via targeted indexed lookup.
   * Enforces tenant isolation, version freshness, and checksum integrity.
   */
  public async resolveReference(reference: ChatMemoryReference): Promise<ChatMemoryResolution> {
    this.diagnostics.referencesRequested++;

    // 1. Check L1 Working Cache
    const cached = this.l1Cache.get(reference.tenantId, reference.objectId, reference.stateVersion);
    if (cached) {
      this.diagnostics.cacheHits++;
      this.diagnostics.referencesResolved++;
      return cached;
    }
    this.diagnostics.cacheMisses++;

    // 2. Resolve VDB Key
    const lookupKey = this._extractVdbLookupKey(reference.objectId);
    const record = await this.store.get(lookupKey);

    if (!record) {
      return Object.freeze({
        reference,
        resolved: false,
        source: 'VDB',
        resolvedAt: Date.now(),
      });
    }

    // 3. Multi-Tenant Isolation Check (Fail Closed)
    const recordTenant = (record.metadata as any)?.tenantId ?? (record as any).tenantId;
    if (recordTenant && recordTenant !== reference.tenantId && reference.tenantId !== 'root') {
      this.diagnostics.tenantConflicts++;
      throw new Error(`TENANT_MISMATCH_CONFLICT: Cannot resolve reference owned by '${recordTenant}' for requester '${reference.tenantId}'.`);
    }

    // 4. Version Safety & Monotonicity
    const vdbVersion = (record.metadata as any)?.stateVersion ?? (record as any).stateVersion ?? 1;
    let effectiveVersion = reference.stateVersion;
    if (vdbVersion > reference.stateVersion) {
      // VDB has a newer version -> refresh reference to new version
      effectiveVersion = vdbVersion;
      this.diagnostics.staleReferences++;
    }

    // 5. Checksum Integrity Verification
    const calculatedChecksum = this._calculateRecordChecksum(record);
    if (reference.checksum && reference.checksum.length === 64) {
      if (reference.checksum.toLowerCase() !== calculatedChecksum.toLowerCase()) {
        this.diagnostics.integrityFailures++;
        throw new Error(`MEMORY_INTEGRITY_FAILURE: Checksum mismatch for object '${reference.objectId}'. Expected ${reference.checksum}, got ${calculatedChecksum}.`);
      }
    }

    // 6. Spatial Attribute Resolution via address369.ts
    let resolvedCellId = reference.cellId;
    let resolvedSpatialInfo: Record<string, unknown> | undefined = undefined;

    if (resolvedCellId === undefined && record.dimension === 3 && (record as any).position) {
      // If record contains coordinate array [x,y,z], map to cellId if in bounds
      const pos = (record as any).position;
      if (Array.isArray(pos) && pos.length === 3) {
        const [x, y, z] = pos;
        if (x >= 0 && x < 7 && y >= 0 && y < 7 && z >= 0 && z < 7) {
          resolvedCellId = coordinateToCellId(x, y, z);
        }
      }
    }

    if (resolvedCellId !== undefined) {
      validateCellId(resolvedCellId);
      const addr369 = cellIdToAddress369(resolvedCellId);
      const coords = cellIdToCoordinate(resolvedCellId);
      resolvedSpatialInfo = {
        cellId: resolvedCellId,
        address369: addr369,
        coordinates: coords,
      };
    }

    // 7. Construct Bounded Projection (Never full raw record clone)
    const projection: Record<string, unknown> = {
      objectId: reference.objectId,
      type: record.type,
      classification: record.classification,
      status: record.status,
      stateVersion: effectiveVersion,
      checksum: calculatedChecksum,
      clusterId: record.clusterId,
      source: record.source,
      ...(resolvedSpatialInfo ?? {}),
    };

    const resolvedRef: ChatMemoryReference = {
      objectId: reference.objectId,
      tenantId: reference.tenantId,
      stateVersion: effectiveVersion,
      checksum: calculatedChecksum,
      cellId: resolvedCellId,
      domain: record.type,
    };

    const resolution: ChatMemoryResolution = Object.freeze({
      reference: resolvedRef,
      resolved: true,
      source: 'VDB',
      projection: Object.freeze(projection),
      resolvedAt: Date.now(),
    });

    // 8. Store in L1 Working Cache
    this.l1Cache.set(resolution);
    this.diagnostics.referencesResolved++;

    return resolution;
  }

  // ???????????????????????????????????????????????????????????????????????????
  // BOUNDED CONTEXT ASSEMBLY
  // ???????????????????????????????????????????????????????????????????????????

  /**
   * Resolves a set of candidate references and builds a bounded ChatCanonicalContext projection.
   * Enforces MAX_CONTEXT_RECORDS and MAX_CONTEXT_BYTES.
   */
  public async buildCanonicalContext(
    references: readonly ChatMemoryReference[]
  ): Promise<ChatCanonicalContext> {
    const boundedRefs = references.slice(0, this.maxContextRecords);
    const resolvedRefs: ChatMemoryReference[] = [];
    const formattedLines: string[] = [];
    let totalBytes = 0;

    for (const ref of boundedRefs) {
      try {
        const res = await this.resolveReference(ref);
        if (res.resolved && res.projection) {
          const projStr = JSON.stringify(res.projection);
          const projBytes = Buffer.byteLength(projStr, 'utf-8');

          if (totalBytes + projBytes > this.maxContextBytes) {
            // Stop adding projections to respect byte budget
            break;
          }

          totalBytes += projBytes;
          resolvedRefs.push(res.reference);
          formattedLines.push(
            `[CANONICAL_MEMORY: ${res.reference.objectId} (v${res.reference.stateVersion}, ${res.reference.domain || 'ENTITY'})] ${projStr}`
          );
        }
      } catch (err: any) {
        // If tenant conflict or integrity failure occurs, record it and omit from context
        continue;
      }
    }

    this.diagnostics.contextBytes = totalBytes;

    return Object.freeze({
      references: Object.freeze(resolvedRefs),
      resolvedCount: resolvedRefs.length,
      contextBytes: totalBytes,
      generatedAt: new Date().toISOString(),
      formattedContext: formattedLines.join('\n'),
    });
  }

  /**
   * End-to-end Chat query resolution:
   * Query -> extract candidates -> resolve -> build bounded context.
   */
  public async resolveContextForQuery(params: {
    query: string;
    tenantId: string;
    spatialCellId?: number;
    spatialCoordinate?: readonly [number, number, number] | [number, number, number];
  }): Promise<ChatCanonicalContext> {
    const candidates = this.extractCandidateReferences(params);
    if (candidates.count === 0) {
      return Object.freeze({
        references: Object.freeze([]),
        resolvedCount: 0,
        contextBytes: 0,
        generatedAt: new Date().toISOString(),
        formattedContext: '',
      });
    }

    return this.buildCanonicalContext(candidates.references);
  }

  // ???????????????????????????????????????????????????????????????????????????
  // EXPLICIT WRITE PATH (GOVERNED & OCC)
  // ???????????????????????????????????????????????????????????????????????????

  /**
   * Explicitly updates or creates a canonical memory entity.
   * Read queries NEVER invoke this. Requires explicit user write action.
   * Enforces OCC, monotonic version bumping, and checksum calculation.
   */
  public async executeExplicitWrite(params: ChatExplicitWriteParams): Promise<ChatExplicitWriteResult> {
    if (IS_ACTUATION_BLOCKED !== true) {
      throw new Error('SECURITY_VIOLATION: Actuation lock asserted.');
    }

    const { tenantId, objectId, baseStateVersion, payload, cellId, expectedChecksum, source } = params;
    const lookupKey = this._extractVdbLookupKey(objectId);

    // 1. Check existing record
    const existing = await this.store.get(lookupKey);
    let previousVersion = 0;

    if (existing) {
      // Check tenant
      const recordTenant = (existing.metadata as any)?.tenantId ?? (existing as any).tenantId;
      if (recordTenant && recordTenant !== tenantId && tenantId !== 'root') {
        this.diagnostics.tenantConflicts++;
        throw new Error(`TENANT_MISMATCH_CONFLICT: Cannot write to record owned by '${recordTenant}'.`);
      }

      previousVersion = (existing.metadata as any)?.stateVersion ?? (existing as any).stateVersion ?? 1;

      // OCC Version Check
      if (previousVersion !== baseStateVersion) {
        this.diagnostics.occConflicts++;
        throw new Error(
          `OCC_VERSION_CONFLICT: Base version mismatch for '${objectId}'. Expected ${baseStateVersion}, found ${previousVersion}.`
        );
      }

      // Checksum check if expectedChecksum supplied
      if (expectedChecksum) {
        const currentChecksum = this._calculateRecordChecksum(existing);
        if (currentChecksum.toLowerCase() !== expectedChecksum.toLowerCase()) {
          this.diagnostics.integrityFailures++;
          throw new Error(`MEMORY_INTEGRITY_FAILURE: Pre-write checksum validation failed for '${objectId}'.`);
        }
      }
    }

    const newVersion = baseStateVersion + 1;
    const now = Date.now();
    const payloadChecksum = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    // Spatial validation if cellId supplied
    let spatialPosition: [number, number, number] | undefined = undefined;
    if (cellId !== undefined) {
      validateCellId(cellId);
      const coords = cellIdToCoordinate(cellId);
      spatialPosition = [coords.x, coords.y, coords.z];
    }

    const updatedRecord: StudioRecord = {
      id: lookupKey,
      type: (existing?.type ?? 'STATES') as any,
      classification: 'GREEN',
      dimension: 3,
      status: 'ACTIVE',
      source: source ?? 'CHAT_CANONICAL_INTEGRATION',
      clusterId: existing?.clusterId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      metadata: {
        payload,
        tenantId,
        stateVersion: newVersion,
        checksum: payloadChecksum,
        cellId,
      },
    };

    if (existing) {
      await this.store.update(lookupKey, updatedRecord);
    } else {
      await this.store.create(updatedRecord);
    }

    this.diagnostics.writesCommitted++;

    const ref: ChatMemoryReference = {
      objectId,
      tenantId,
      stateVersion: newVersion,
      checksum: payloadChecksum,
      cellId,
      domain: updatedRecord.type,
    };

    // Update L1 cache and evict older versions
    this.l1Cache.set({
      reference: ref,
      resolved: true,
      source: 'VDB',
      projection: {
        objectId,
        type: updatedRecord.type,
        status: updatedRecord.status,
        stateVersion: newVersion,
        checksum: payloadChecksum,
        cellId,
      },
      resolvedAt: now,
    });

    return Object.freeze({
      success: true,
      reference: ref,
      previousVersion,
      newVersion,
    });
  }

  // ???????????????????????????????????????????????????????????????????????????
  // PRIVATE HELPERS
  // ???????????????????????????????????????????????????????????????????????????

  private _extractVdbLookupKey(objectId: string): string {
    const prefix = 'URN:CUBIO:SPATIAL_MEMORY:';
    if (objectId.startsWith(prefix)) {
      return objectId.slice(prefix.length);
    }
    return objectId;
  }

  private _calculateRecordChecksum(record: StudioRecord): string {
    const meta = record.metadata as any;
    if (meta && meta.checksum && typeof meta.checksum === 'string' && meta.checksum.length === 64) {
      return meta.checksum;
    }
    const digestable = {
      id: record.id,
      type: record.type,
      classification: record.classification,
      status: record.status,
      source: record.source,
      clusterId: record.clusterId,
      payload: meta?.payload ?? null,
    };
    return crypto.createHash('sha256').update(JSON.stringify(digestable)).digest('hex');
  }
}
