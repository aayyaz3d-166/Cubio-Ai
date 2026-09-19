/**
 * CUBiO AI — PMA Task 405: On-Demand VDB State Reconstruction Engine
 * 
 * Extends the validated on-demand reconstruction architecture to reconstruct
 * approved VDB-grounded state references strictly on-demand.
 * 
 * Principles & Epistemic Safeguards:
 * 1. Minimal On-Demand Loading: Loads ONLY the requested primary record through the
 *    read-only adapter; never queries or materializes surrounding states or the full VDB.
 * 2. Strict LRU Caching & Eviction: Configurable bounded memory capacity with eviction policy
 *    and instrumented cache hit/miss latency.
 * 3. Deterministic Lineage & Cryptographic Invariance: Reconstructed nodes match
 *    the expected state hash bit-for-bit across calls.
 * 4. Zero Storage Mutation: Disallows write-backs to persistent storage or Core database.
 * 5. Deterministic Fail-Closed Traps: Fails immediately on malformed IDs, missing records,
 *    or non-spatial records without leaking unhandled exceptions.
 */

import { Phase26VdbReadOnlyAdapter } from './vdbReadOnlyAdapter';
import { VdbGroundedStateGenerator, Phase25GroundedState } from './vdbGroundedStateGenerator';
import { CompactStateAddressingEngine } from './compactStateAddressing';
import { SpatialCoordXYZ } from './types';

export interface VdbReconstructionPacket {
  readonly recordId: string;
  readonly proceduralAddress: string;
  readonly canonicalUrn: string;
  readonly normalizedCoord: SpatialCoordXYZ;
  readonly stateHash: string;
  readonly cellId: number;
  readonly address369: number;
  readonly provenance: {
    readonly classification: string;
    readonly continuousPosition: readonly [number, number, number];
    readonly status: string;
  };
  readonly latencyUs: number;
  readonly isCacheHit: boolean;
}

export interface CacheStatistics {
  readonly capacity: number;
  readonly currentSize: number;
  readonly hits: number;
  readonly misses: number;
  readonly evictions: number;
  readonly hitRatePercent: number;
}

export class VdbReconstructionLRUCache {
  private capacity: number;
  private cache: Map<string, VdbReconstructionPacket>;
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;

  constructor(capacity: number = 16) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  public get(recordId: string): VdbReconstructionPacket | undefined {
    const item = this.cache.get(recordId);
    if (item) {
      this.hits++;
      // Move to newest position (delete and re-insert)
      this.cache.delete(recordId);
      this.cache.set(recordId, item);
      return item;
    }
    this.misses++;
    return undefined;
  }

  public set(recordId: string, packet: VdbReconstructionPacket): void {
    if (this.cache.has(recordId)) {
      this.cache.delete(recordId);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        this.evictions++;
      }
    }
    this.cache.set(recordId, packet);
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  public getStats(): CacheStatistics {
    const total = this.hits + this.misses;
    return {
      capacity: this.capacity,
      currentSize: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRatePercent: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }
}

export class OnDemandVdbReconstructionEngine {
  private generator: VdbGroundedStateGenerator;
  private cache: VdbReconstructionLRUCache;

  constructor(adapter?: Phase26VdbReadOnlyAdapter, cacheCapacity: number = 16) {
    this.generator = new VdbGroundedStateGenerator(adapter);
    this.cache = new VdbReconstructionLRUCache(cacheCapacity);
  }

  /**
   * Reconstructs an approved VDB-grounded state reference on-demand by primary key ID.
   * Leverages LRU cache; loads ONLY the requested single record if cache miss.
   */
  public reconstructOnDemand(recordId: string): VdbReconstructionPacket {
    const t0 = performance.now();

    // Check LRU cache first
    const cached = this.cache.get(recordId);
    if (cached) {
      const latencyUs = (performance.now() - t0) * 1000;
      return {
        ...cached,
        latencyUs: Math.round(latencyUs * 10) / 10,
        isCacheHit: true,
      };
    }

    // Cache miss: on-demand generation of single record
    const grounded: Phase25GroundedState = this.generator.generateFromVdbRecord(recordId);

    const latencyUs = (performance.now() - t0) * 1000;
    const packet: VdbReconstructionPacket = {
      recordId,
      proceduralAddress: grounded.proceduralAddress,
      canonicalUrn: grounded.reconstructedNode.urn,
      normalizedCoord: grounded.normalizedSpatialCoord,
      stateHash: grounded.reconstructedNode.stateHash,
      cellId: grounded.vdbProvenance!.cellId,
      address369: grounded.vdbProvenance!.address369,
      provenance: {
        classification: grounded.vdbProvenance!.classification,
        continuousPosition: grounded.vdbProvenance!.continuousPosition,
        status: grounded.vdbProvenance!.status,
      },
      latencyUs: Math.round(latencyUs * 10) / 10,
      isCacheHit: false,
    };

    // Store in bounded LRU cache
    this.cache.set(recordId, packet);

    return packet;
  }

  /**
   * Reconstructs directly from a procedural CVA string referencing a VDB-grounded state.
   */
  public reconstructFromProceduralAddress(cvaAddress: string): {
    status: string;
    urn?: string;
    coord?: SpatialCoordXYZ;
    stateHash?: string;
    latencyUs: number;
    error?: string;
  } {
    const t0 = performance.now();
    const resolved = CompactStateAddressingEngine.resolveAddress(cvaAddress);
    const latencyUs = (performance.now() - t0) * 1000;

    if (resolved.status !== "RESOLVED" || !resolved.reconstructedNode) {
      return {
        status: resolved.status,
        latencyUs: Math.round(latencyUs * 10) / 10,
        error: resolved.errorMessage || "Resolution failure",
      };
    }

    return {
      status: "RESOLVED",
      urn: resolved.reconstructedNode.urn,
      coord: resolved.reconstructedNode.coord,
      stateHash: resolved.reconstructedNode.stateHash,
      latencyUs: Math.round(latencyUs * 10) / 10,
    };
  }

  /**
   * Reconstructs a bounded batch of IDs sequentially on demand.
   */
  public reconstructBatchOnDemand(recordIds: string[]): {
    packets: VdbReconstructionPacket[];
    cacheStats: CacheStatistics;
    totalTimeMs: number;
  } {
    const t0 = performance.now();
    const packets: VdbReconstructionPacket[] = [];

    for (const id of recordIds) {
      packets.push(this.reconstructOnDemand(id));
    }

    const totalTimeMs = Math.round((performance.now() - t0) * 1000) / 1000;
    return {
      packets,
      cacheStats: this.cache.getStats(),
      totalTimeMs,
    };
  }

  public getCacheStatistics(): CacheStatistics {
    return this.cache.getStats();
  }

  public clearCache(): void {
    this.cache.clear();
  }
}
