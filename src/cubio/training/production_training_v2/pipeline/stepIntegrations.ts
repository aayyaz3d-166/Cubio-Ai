/**
 * CubiO — Universal Spatial Operating Environment
 * Step 79: Production Training v2 Cross-Step Integrations Bridge
 *
 * Connects Production Training v2 with:
 * - Steps 55–78 Foundational Trajectory
 * - Step 62: Research Certification & Experiment Registry
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ProductionTrainingV2Manifest } from '../types';
import { ExperimentRegistry } from '../../../research/certification/experimentRegistry';

export class ProductionTrainingV2StepIntegrations {
  /**
   * Registers production training v2 manifest in Step 62 Experiment Registry.
   */
  public static bridgeToStep62Certification(manifest: ProductionTrainingV2Manifest): {
    experimentRecord: ReturnType<typeof ExperimentRegistry.register>;
  } {
    const experimentRecord = ExperimentRegistry.register(
      'REAL_PRODUCTION_TRAINING_V2_STEP_79',
      manifest.profile,
      {
        runId: manifest.runId,
        modelVersion: manifest.modelVersion,
        profile: manifest.profile,
        runMode: manifest.runMode,
        tokensProcessed: manifest.totalTokensProcessed,
        optimizerUpdates: manifest.totalOptimizerUpdates,
        initialTrainLoss: manifest.initialTrainLoss,
        finalTrainLoss: manifest.finalTrainLoss,
        heldOutValidationLoss: manifest.heldOutValidationLoss,
        heldOutValidationPerplexity: manifest.heldOutValidationPerplexity,
        parameterDeltaL2: manifest.parameterProof.l2ParameterDeltaNorm,
        peakRSSBytes: manifest.hardwareTelemetry.peakRSSBytes,
        isProductionCertified: manifest.isOfficiallyProductionCertified,
        isEdge2GBCompliant: manifest.isEdge2GBCompliant,
        masterMerkleRoot: manifest.masterMerkleRoot,
      },
      'REAL_MEASURED'
    );

    return { experimentRecord };
  }
}
