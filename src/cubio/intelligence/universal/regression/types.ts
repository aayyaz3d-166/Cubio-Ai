/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F73: Universal Intelligence Regression Types & Contracts
 *
 * Covers F1 -> F72 Master Regression Matrix.
 */

export type RegressionCheckpointId =
  | 'F45_A_369_HARMONIC'
  | 'F45_B_SPATIAL_MANIFOLDS'
  | 'F45_C_DIMENSIONAL_STATE'
  | 'F45_D_DETERMINISM_SIGMA0'
  | 'F46_F59_MULTIMODAL_ROUTING'
  | 'F60_F65_MULTIAGENT_WORKFLOWS'
  | 'F66_MASTER_ORCHESTRATOR'
  | 'F67_F68_GOVERNANCE_RELIABILITY'
  | 'F69_F71_API_UI_PROVIDERS'
  | 'F72_PRODUCTION_PERFORMANCE';

export interface RegressionCheckpointResult {
  readonly checkpointId: RegressionCheckpointId;
  readonly name: string;
  readonly funnelsCovered: string;
  readonly passed: boolean;
  readonly assertionsCount: number;
  readonly executionTimeMs: number;
  readonly details: readonly string[];
}

export interface UniversalRegressionReport {
  readonly reportId: string;
  readonly totalCheckpoints: number;
  readonly passedCheckpoints: number;
  readonly failedCheckpoints: number;
  readonly totalAssertions: number;
  readonly overallPassed: boolean;
  readonly funnelsCertifiedRange: string;
  readonly zeroRegressionCertified: boolean;
  readonly checksumSignature: string;
  readonly timestamp: number;
  readonly checkpoints: readonly RegressionCheckpointResult[];
}

export interface IUniversalRegressionHarness {
  runFullRegression(): Promise<Readonly<UniversalRegressionReport>>;
}
