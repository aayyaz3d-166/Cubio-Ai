/**
 * CubiO — Universal Spatial Operating Environment
 * Step 80: Long-Duration Training Cross-Step Integrations Bridge
 *
 * Connects Step 80 with:
 * - Steps 55–79 Foundational Trajectory
 * - Step 62: Research Certification & Experiment Registry
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { LongDurationTrainingManifest } from '../types';
import { ExperimentRegistry } from '../../../research/certification/experimentRegistry';

export class LongDurationTrainingStepIntegrations {
  /**
   * Registers long-duration training manifest in Step 62 Experiment Registry.
   */
  public static bridgeToStep62Certification(manifest: LongDurationTrainingManifest): {
    experimentRecord: ReturnType<typeof ExperimentRegistry.register>;
  } {
    const experimentRecord = ExperimentRegistry.register(
      'LONG_DURATION_REAL_TRAINING_STEP_80',
      manifest.profile,
      {
        manifestId: manifest.manifestId,
        modelVersion: manifest.modelVersion,
        profile: manifest.profile,
        stage: manifest.stage,
        tokensProcessed: manifest.actualTokensProcessed,
        optimizerUpdates: manifest.optimizerUpdatesApplied,
        initialLoss: manifest.initialLoss,
        finalLoss: manifest.finalLoss,
        heldOutValidationLoss: manifest.heldOutValidationLoss,
        heldOutValidationPerplexity: manifest.heldOutValidationPerplexity,
        parameterDeltaL2: manifest.parameterDeltaL2Norm,
        peakRSSBytes: manifest.hardwareTelemetry.peakProcessRSSBytes,
        checkpointCount: manifest.checkpointChain.length,
        convergenceStatus: manifest.convergenceStatus,
        isLongRunCertified: manifest.isOfficiallyLongRunCertified,
        isAntiFabricationAuditPassed: manifest.antiFabricationAudit.isAuditPassed,
        masterMerkleRoot: manifest.masterMerkleRoot,
      },
      'REAL_MEASURED'
    );

    return { experimentRecord };
  }
}
