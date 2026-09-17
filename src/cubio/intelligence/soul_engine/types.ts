/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 12: SOUL Intelligence Engine — Core Type Definitions (F148–F160)
 *
 * Defines the software intelligence identity, sector boundaries, dimensional state graph,
 * and lifecycle evolution for sector-specific intelligent agents.
 */

export type SectorDomainType =
  | 'JEWELRY_PRECISION_CAD'
  | 'AEROSPACE_STRUCTURAL'
  | 'AEROSPACE_STRUCTURAL_TOPOLOGY'
  | 'BIOMEDICAL_MICROFLUIDIC'
  | 'BIOMEDICAL_MICROFLUIDIC_MANIFOLD'
  | 'ACOUSTIC_PHOTONIC_METAMATERIAL';

export type DimensionalTierType =
  | 'LOWER_RAW_OBSERVATIONS'
  | 'CORE_OBJECTS_RELATIONSHIPS_SKILLS'
  | 'HIGHER_PATTERNS_STRATEGIES'
  | 'META_EVALUATION_OPTIMIZATION'
  | 'GOVERNANCE_HUMAN_AUTHORITY';

export interface SoulIdentityManifest {
  readonly soulId: string;
  readonly soulName: string;
  readonly sector: SectorDomainType;
  readonly version: string; // e.g. 'v0.1.0'
  readonly creationTimestamp: number;
  readonly parentSoulId?: string;
  readonly dimensionalTiers: readonly DimensionalTierType[];
  readonly coreCapabilities: readonly string[];
  readonly immutableBoundaryConstraints: readonly string[];
  readonly memoryPartitionId: string;
  readonly governanceLevel: 'STRICT_HUMAN_AUTHORIZED';
  readonly provenanceHash: string;
  readonly cryptographicIdentitySeal: string;
}

export interface F148SoulIdentityReport {
  readonly identityReportId: string;
  readonly soulManifest: SoulIdentityManifest;
  readonly sectorBoundariesEnforced: boolean;
  readonly dimensionalTierStructureValid: boolean;
  readonly f148AcceptanceGatePassed: boolean;
  readonly cryptographicProof: string;
  readonly timestamp: number;
}
