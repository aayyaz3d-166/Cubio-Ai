/**
 * CUBiO AI — Task 193: Native Evidence and Source Provenance Architecture
 * src/cubio/model/native_evidence_provenance/provenanceRegistry.ts
 *
 * Isolated In-Memory Provenance Registry:
 * Stores verified evidence chains and creates zero-copy ProvenanceDescriptors.
 * Strictly partitioned by tenant.
 */

import * as crypto from 'crypto';
import {
  EvidenceChain,
  ProvenanceDescriptor,
  EvidenceProvenanceTenantViolationError,
} from './types';

export class ProvenanceRegistry {
  // Tenant -> Map<provenanceId, EvidenceChain>
  private static readonly chainsByTenant = new Map<string, Map<string, EvidenceChain>>();
  // Tenant -> Map<claimId, string (provenanceId)>
  private static readonly claimToProvByTenant = new Map<string, Map<string, string>>();
  // Tenant -> Map<provenanceId, ProvenanceDescriptor>
  private static readonly descriptorsByTenant = new Map<string, Map<string, ProvenanceDescriptor>>();

  /**
   * Registers a verified evidence chain and indexes a zero-copy descriptor.
   */
  public static register(chain: EvidenceChain, isVerified: boolean = true): ProvenanceDescriptor {
    const tenantId = chain.tenantId;
    this.assertTenantValid(tenantId);

    const chainMap = this.getOrCreateMap(this.chainsByTenant, tenantId);
    const claimMap = this.getOrCreateMap(this.claimToProvByTenant, tenantId);
    const descMap = this.getOrCreateMap(this.descriptorsByTenant, tenantId);

    const provenanceId = `PROV-${chain.compositeHash.slice(0, 16)}`;
    chainMap.set(provenanceId, chain);
    claimMap.set(chain.claimId, provenanceId);

    const rootChecksum = chain.nodes.length > 0 ? chain.nodes[0].sourceIdentity.payloadChecksum : '';
    const leafNode = chain.nodes[chain.nodes.length - 1];

    const descriptor: ProvenanceDescriptor = {
      provenanceId,
      claimId: chain.claimId,
      tenantId,
      chainDepth: chain.nodes.length,
      rootChecksum,
      compositeHash: chain.compositeHash,
      epistemicTier: leafNode?.epistemicTier ?? 'OBSERVATION',
      confidence: leafNode?.confidence ?? 0.5,
      isVerified,
    };

    descMap.set(provenanceId, descriptor);
    return descriptor;
  }

  /**
   * Retrieves a zero-copy descriptor by provenance ID.
   */
  public static getDescriptor(provenanceId: string, tenantId: string): ProvenanceDescriptor | undefined {
    this.assertTenantValid(tenantId);
    const descMap = this.descriptorsByTenant.get(tenantId);
    return descMap?.get(provenanceId);
  }

  /**
   * Retrieves a zero-copy descriptor by claim ID.
   */
  public static getDescriptorByClaim(claimId: string, tenantId: string): ProvenanceDescriptor | undefined {
    this.assertTenantValid(tenantId);
    const claimMap = this.claimToProvByTenant.get(tenantId);
    const provId = claimMap?.get(claimId);
    if (!provId) return undefined;
    return this.getDescriptor(provId, tenantId);
  }

  /**
   * Retrieves the full evidence chain on demand (materialization).
   */
  public static getChain(provenanceId: string, tenantId: string): EvidenceChain | undefined {
    this.assertTenantValid(tenantId);
    const chainMap = this.chainsByTenant.get(tenantId);
    return chainMap?.get(provenanceId);
  }

  /**
   * Lists all zero-copy descriptors for a tenant.
   */
  public static listDescriptors(tenantId: string): readonly ProvenanceDescriptor[] {
    this.assertTenantValid(tenantId);
    const descMap = this.descriptorsByTenant.get(tenantId);
    if (!descMap) return [];
    return Array.from(descMap.values());
  }

  /**
   * Returns count of registered chains for a tenant.
   */
  public static count(tenantId: string): number {
    this.assertTenantValid(tenantId);
    const chainMap = this.chainsByTenant.get(tenantId);
    return chainMap ? chainMap.size : 0;
  }

  /**
   * Computes a deterministic SHA-256 digest of all provenance descriptors for a tenant.
   */
  public static computeDigest(tenantId: string): string {
    const descriptors = this.listDescriptors(tenantId);
    const sorted = [...descriptors].sort((a, b) => a.provenanceId.localeCompare(b.provenanceId));
    const serialized = sorted
      .map((d) => `${d.provenanceId}:${d.claimId}:${d.compositeHash}:${d.isVerified}`)
      .join('||');

    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Clears registry for a specific tenant or all.
   */
  public static reset(tenantId?: string): void {
    if (tenantId) {
      this.chainsByTenant.delete(tenantId);
      this.claimToProvByTenant.delete(tenantId);
      this.descriptorsByTenant.delete(tenantId);
    } else {
      this.chainsByTenant.clear();
      this.claimToProvByTenant.clear();
      this.descriptorsByTenant.clear();
    }
  }

  private static assertTenantValid(tenantId: string): void {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new EvidenceProvenanceTenantViolationError('Tenant ID cannot be empty');
    }
  }

  private static getOrCreateMap<K, V>(container: Map<string, Map<K, V>>, tenantId: string): Map<K, V> {
    let map = container.get(tenantId);
    if (!map) {
      map = new Map<K, V>();
      container.set(tenantId, map);
    }
    return map;
  }
}
