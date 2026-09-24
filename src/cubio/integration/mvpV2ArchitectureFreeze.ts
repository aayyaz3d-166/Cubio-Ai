/**
 * CUBiO AI — PMA Task 414: MVP V2 Integration Architecture Freeze
 * src/cubio/integration/mvpV2ArchitectureFreeze.ts
 *
 * Freezes the production architecture for CUBiO AI MVP Version 2 using exclusively
 * verified Phase 26 outputs and certified sovereign Core baselines.
 * 
 * Boundaries & Safeguards:
 * 1. Zero mutation to canonical database, Native1M checkpoint, or 369 authority.
 * 2. Explicitly maps approved Phase 26 artifacts, Core intelligence, chat memory, and security guards.
 * 3. Enforces an exclusion ledger barring unverified research and theoretical materializations.
 * 4. Defines acyclic one-way dependency boundaries preserving Core sovereignty.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface ApprovedMvpComponent {
  readonly componentId: string;
  readonly componentName: string;
  readonly sourcePath: string;
  readonly role: string;
  readonly category: 'CORE_INTELLIGENCE' | 'VDB_GROUNDING' | 'SECURITY_ISOLATION' | 'SPATIAL_AUTHORITY' | 'CHAT_MEMORY' | 'PERSISTENCE';
  readonly readOnlyEnforced: boolean;
  readonly verificationGate: string;
}

export interface ExcludedResearchArtifact {
  readonly artifactId: string;
  readonly relativePath: string;
  readonly reasonForExclusion: string;
  readonly category: 'THEORETICAL_EXTRAPOLATION' | 'UNVERIFIED_PROTOTYPE' | 'LEGACY_MOCK' | 'EXPERIMENTAL_STRESS';
}

export interface DependencyFlowEdge {
  readonly fromLayer: string;
  readonly toLayer: string;
  readonly interactionType: 'READ_ONLY_QUERY' | 'PROJECTION_TRANSFORMATION' | 'AUTHORITY_CHECK' | 'INFERENCE_CALL' | 'PERSISTENCE_LOOKUP';
  readonly isAcyclic: boolean;
}

export interface MvpV2ArchitectureManifest {
  readonly architectureName: string;
  readonly version: string;
  readonly lifecycleStatus: 'MVP_V2_ARCHITECTURE_FROZEN';
  readonly timestamp: string;
  readonly totalApprovedComponents: number;
  readonly totalExcludedArtifacts: number;
  readonly approvedComponents: readonly ApprovedMvpComponent[];
  readonly excludedArtifacts: readonly ExcludedResearchArtifact[];
  readonly dependencyFlow: readonly DependencyFlowEdge[];
  readonly sovereignAssetCustody: Record<string, {
    readonly expectedHash: string;
    readonly actualHash: string;
    readonly matches: boolean;
    readonly sizeBytes: number;
  }>;
}

export class MvpV2ArchitectureFreeze {
  public static readonly SOVEREIGN_ASSET_BASELINES: Record<string, string> = {
    'data/cubio_studio.db': 'bafd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6',
    'data/checkpoints/phase16_production_final_sealed_1m.3dmemory': '453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8',
    'src/core/address369.ts': '12eef2d3ec79bce873a064443787587a32711145ea82d375333c2222303fe612',
    'src/cubio/core/chatMemoryIntegration.ts': 'cb2978981826e5b1f500bf08d280cb0354b8cbda82140b67d5b938bbd0c144ac',
    'src/cubio/core/canonicalIdentity.ts': '3fcb2b18066fdd4c53bdc2a00d8bee8837cf366c4526e36f5718ca78c7036a29',
    'src/funnel71/persistence/sqlitePersistence.ts': 'cf78f31106ac0d754a404c72ef90f95c8b93c8d55d163e9ceb32d53693b1f0c6'
  };

  private readonly workspaceRoot: string;

  constructor(workspaceRoot = '.') {
    this.workspaceRoot = path.resolve(workspaceRoot);
  }

  /**
   * Authoritative list of components approved for MVP Version 2 entry.
   * Exclusively includes verified Phase 26 modules and frozen Core baselines.
   */
  public getApprovedMvpComponents(): ApprovedMvpComponent[] {
    return [
      // 1. Phase 26 VDB Read-Only Adapter
      {
        componentId: 'CMP-P26-01',
        componentName: 'Phase26VdbReadOnlyAdapter',
        sourcePath: 'src/research/infinitylm/vdbReadOnlyAdapter.ts',
        role: 'Sovereign read-only interface to canonical SQLite storage with hardware fail-closed enforcement (readOnly: true)',
        category: 'VDB_GROUNDING',
        readOnlyEnforced: true,
        verificationGate: 'PMA-395'
      },
      // 2. Phase 26 Canonical 369 Bridge
      {
        componentId: 'CMP-P26-02',
        componentName: 'Canonical369Bridge',
        sourcePath: 'src/research/infinitylm/canonical369Bridge.ts',
        role: 'Deterministic bridge translating 3D coordinates & cell IDs [0..342] to address 369 [26..368]',
        category: 'SPATIAL_AUTHORITY',
        readOnlyEnforced: true,
        verificationGate: 'PMA-397'
      },
      // 3. Phase 26 VDB to Phase 25 Projection Engine
      {
        componentId: 'CMP-P26-03',
        componentName: 'VdbToPhase25ProjectionEngine',
        sourcePath: 'src/research/infinitylm/vdbToPhase25ProjectionEngine.ts',
        role: 'Lightweight projection of StudioRecord entries into Compact State Addressing recipes',
        category: 'VDB_GROUNDING',
        readOnlyEnforced: true,
        verificationGate: 'PMA-399'
      },
      // 4. Phase 26 Grounded State Generator
      {
        componentId: 'CMP-P26-04',
        componentName: 'VdbGroundedStateGenerator',
        sourcePath: 'src/research/infinitylm/vdbGroundedStateGenerator.ts',
        role: 'Generates grounded Phase 25 state references with verifiable REAL_VDB_GROUNDED provenance',
        category: 'VDB_GROUNDING',
        readOnlyEnforced: true,
        verificationGate: 'PMA-402'
      },
      // 5. Phase 26 On-Demand VDB Reconstruction Engine
      {
        componentId: 'CMP-P26-05',
        componentName: 'OnDemandVdbReconstructionEngine',
        sourcePath: 'src/research/infinitylm/onDemandVdbReconstructionEngine.ts',
        role: 'On-demand sub-millisecond state reconstruction with LRU cache acceleration (>70x)',
        category: 'VDB_GROUNDING',
        readOnlyEnforced: true,
        verificationGate: 'PMA-405'
      },
      // 6. Phase 26 VDB Reference Search Engine
      {
        componentId: 'CMP-P26-06',
        componentName: 'VdbReferenceSearchEngine',
        sourcePath: 'src/research/infinitylm/vdbReferenceSearchEngine.ts',
        role: 'Controlled reference search across authorized public state projection fields without leaking internal columns',
        category: 'VDB_GROUNDING',
        readOnlyEnforced: true,
        verificationGate: 'PMA-406'
      },
      // 7. Native 1M Sovereign Production Service
      {
        componentId: 'CMP-COR-01',
        componentName: 'Native1mProductionService',
        sourcePath: 'src/cubio/inference/native1mProductionService.ts',
        role: 'Live inference service connecting runtime to the sealed 971,520-parameter sovereign model',
        category: 'CORE_INTELLIGENCE',
        readOnlyEnforced: true,
        verificationGate: 'PMA-298'
      },
      // 8. Core Chat Memory Integration
      {
        componentId: 'CMP-COR-02',
        componentName: 'ChatMemoryIntegration',
        sourcePath: 'src/cubio/core/chatMemoryIntegration.ts',
        role: 'Store-once reference-everywhere chat memory bridge with L1 LRU capacity and bounded context',
        category: 'CHAT_MEMORY',
        readOnlyEnforced: true,
        verificationGate: 'TASK-14'
      },
      // 9. Universal Canonical Identity
      {
        componentId: 'CMP-COR-03',
        componentName: 'CanonicalIdentity',
        sourcePath: 'src/cubio/core/canonicalIdentity.ts',
        role: 'Universal identity contract separating objectId, cellId, stateVersion, and SHA-256 checksum',
        category: 'SPATIAL_AUTHORITY',
        readOnlyEnforced: true,
        verificationGate: 'TASK-04'
      },
      // 10. Address 369 Spatial Authority
      {
        componentId: 'CMP-COR-04',
        componentName: 'Address369Authority',
        sourcePath: 'src/core/address369.ts',
        role: 'Single source of spatial truth defining 26 symbolic anchors and 343 HCP spatial cells [26..368]',
        category: 'SPATIAL_AUTHORITY',
        readOnlyEnforced: true,
        verificationGate: 'BASELINE-CORE'
      },
      // 11. SQLite Persistent DataStore
      {
        componentId: 'CMP-COR-05',
        componentName: 'SQLiteDataStore',
        sourcePath: 'src/funnel71/persistence/sqlitePersistence.ts',
        role: 'Canonical disk-backed persistence implementing StudioDataStore using built-in node:sqlite',
        category: 'PERSISTENCE',
        readOnlyEnforced: false, // Authoritative storage has controlled writes via transaction
        verificationGate: 'FUNNEL-71'
      },
      // 12. External Model & Actuation Safety Guard
      {
        componentId: 'CMP-COR-06',
        componentName: 'ExternalModelGuard',
        sourcePath: 'src/cubio/model/native_foundation/external_model_guard.ts',
        role: 'Fail-closed isolation enforcing zero external pretrained models, zero network egress, and permanent actuation lockout',
        category: 'SECURITY_ISOLATION',
        readOnlyEnforced: true,
        verificationGate: 'PHASE-24'
      }
    ];
  }

  /**
   * Explicit Exclusion Ledger: Artifacts barred from MVP Version 2 entry.
   */
  public getExcludedResearchArtifacts(): ExcludedResearchArtifact[] {
    return [
      {
        artifactId: 'EXC-RES-01',
        relativePath: 'src/research/infinitylm/hypothesis10to124Reconstruction.ts',
        reasonForExclusion: 'Physical materialization of 10^124 state space is physically impossible under quantum and baryon limits; theoretical grammar only.',
        category: 'THEORETICAL_EXTRAPOLATION'
      },
      {
        artifactId: 'EXC-RES-02',
        relativePath: 'src/research/infinitylm/stateSpaceStressTest.ts',
        reasonForExclusion: 'Unbounded combinatoric stress harness not intended for production runtime.',
        category: 'EXPERIMENTAL_STRESS'
      },
      {
        artifactId: 'EXC-RES-03',
        relativePath: 'src/research/infinitylm/massiveCardinalityEngine.ts',
        reasonForExclusion: 'Theoretical calculation utility for permutations up to 10^124; non-operational in bounded MVP.',
        category: 'THEORETICAL_EXTRAPOLATION'
      },
      {
        artifactId: 'EXC-RES-04',
        relativePath: 'src/research/infinitylm/shannonInformationLayer.ts',
        reasonForExclusion: 'Research-only entropy estimation framework; excluded from runtime MVP reasoning pipeline.',
        category: 'UNVERIFIED_PROTOTYPE'
      },
      {
        artifactId: 'EXC-RES-05',
        relativePath: 'src/research/infinitylm/spatialDistributionBenchmark.ts',
        reasonForExclusion: 'Synthetic benchmark harness used for spatial density experiments; not a runtime production dependency.',
        category: 'EXPERIMENTAL_STRESS'
      },
      {
        artifactId: 'EXC-RES-06',
        relativePath: 'src/research/infinitylm/coreReplicaSyncLayer.ts',
        reasonForExclusion: 'Experimental multi-replica replication model; superseded by deterministic on-demand reconstruction.',
        category: 'LEGACY_MOCK'
      }
    ];
  }

  /**
   * Immutable Acyclic Dependency Flow for MVP Version 2
   */
  public getDependencyFlow(): DependencyFlowEdge[] {
    return [
      {
        fromLayer: 'UI / Chat Client Layer',
        toLayer: 'Native1mProductionService',
        interactionType: 'INFERENCE_CALL',
        isAcyclic: true
      },
      {
        fromLayer: 'Native1mProductionService',
        toLayer: 'ChatMemoryIntegration',
        interactionType: 'READ_ONLY_QUERY',
        isAcyclic: true
      },
      {
        fromLayer: 'ChatMemoryIntegration',
        toLayer: 'VdbReferenceSearchEngine',
        interactionType: 'READ_ONLY_QUERY',
        isAcyclic: true
      },
      {
        fromLayer: 'VdbReferenceSearchEngine',
        toLayer: 'VdbToPhase25ProjectionEngine',
        interactionType: 'PROJECTION_TRANSFORMATION',
        isAcyclic: true
      },
      {
        fromLayer: 'VdbToPhase25ProjectionEngine',
        toLayer: 'Canonical369Bridge',
        interactionType: 'AUTHORITY_CHECK',
        isAcyclic: true
      },
      {
        fromLayer: 'Canonical369Bridge',
        toLayer: 'Address369Authority (src/core/address369.ts)',
        interactionType: 'AUTHORITY_CHECK',
        isAcyclic: true
      },
      {
        fromLayer: 'VdbToPhase25ProjectionEngine',
        toLayer: 'Phase26VdbReadOnlyAdapter',
        interactionType: 'READ_ONLY_QUERY',
        isAcyclic: true
      },
      {
        fromLayer: 'Phase26VdbReadOnlyAdapter',
        toLayer: 'Canonical VDB (data/cubio_studio.db)',
        interactionType: 'READ_ONLY_QUERY',
        isAcyclic: true
      },
      {
        fromLayer: 'Native1mProductionService',
        toLayer: 'Native1M Checkpoint (data/checkpoints/...)',
        interactionType: 'READ_ONLY_QUERY',
        isAcyclic: true
      },
      {
        fromLayer: 'Native1mProductionService',
        toLayer: 'ExternalModelGuard',
        interactionType: 'AUTHORITY_CHECK',
        isAcyclic: true
      }
    ];
  }

  /**
   * Live cryptographic custody verification across all frozen production assets
   */
  public verifySovereignAssetCustody(): Record<string, { expectedHash: string; actualHash: string; matches: boolean; sizeBytes: number }> {
    const results: Record<string, { expectedHash: string; actualHash: string; matches: boolean; sizeBytes: number }> = {};

    for (const [relPath, expectedHash] of Object.entries(MvpV2ArchitectureFreeze.SOVEREIGN_ASSET_BASELINES)) {
      const fullPath = path.resolve(this.workspaceRoot, relPath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`FAIL_CLOSED_CUSTODY_ERROR: Protected production asset missing at ${fullPath}`);
      }

      const buf = fs.readFileSync(fullPath);
      const actualHash = crypto.createHash('sha256').update(buf).digest('hex');
      const matches = actualHash === expectedHash;

      if (!matches) {
        throw new Error(`FAIL_CLOSED_CUSTODY_ERROR: Cryptographic hash mismatch for ${relPath}. Expected: ${expectedHash}, Actual: ${actualHash}`);
      }

      results[relPath] = {
        expectedHash,
        actualHash,
        matches,
        sizeBytes: buf.length
      };
    }

    return results;
  }

  /**
   * Generates the immutable MVP V2 Production Architecture Manifest.
   */
  public generateArchitectureManifest(): MvpV2ArchitectureManifest {
    const custody = this.verifySovereignAssetCustody();
    const approved = this.getApprovedMvpComponents();
    const excluded = this.getExcludedResearchArtifacts();
    const dependencyFlow = this.getDependencyFlow();

    return {
      architectureName: 'CUBiO AI MVP Version 2 Integrated Architecture',
      version: '2.0.0-PROD-FROZEN',
      lifecycleStatus: 'MVP_V2_ARCHITECTURE_FROZEN',
      timestamp: new Date().toISOString(),
      totalApprovedComponents: approved.length,
      totalExcludedArtifacts: excluded.length,
      approvedComponents: approved,
      excludedArtifacts: excluded,
      dependencyFlow,
      sovereignAssetCustody: custody
    };
  }
}
