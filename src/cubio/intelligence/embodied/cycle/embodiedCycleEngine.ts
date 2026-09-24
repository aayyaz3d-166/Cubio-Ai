/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 7: 7-Stage Embodied Cycle Engine
 *
 * Coordinates the full closed-loop interaction pipeline:
 * PERCEIVE -> PLAN -> ACT -> OBSERVE -> VERIFY -> LEARN -> IMPROVE
 * across real filesystems, codebases, 3D CAD environments, and governed APIs.
 */

import { deterministicHash } from '../../../state/determinism';
import {
  EmbodiedAction,
  EmbodiedCycleExecutionReport,
  EmbodiedPlan,
  EnvironmentObservation,
  EnvironmentPerception,
  EnvironmentType,
  IEmbodiedCycleEngine,
  InvariantVerification,
  LearningArtifact,
} from '../types';
import { WorkspaceEnvironmentAdapter } from '../adapters/workspaceEnvironmentAdapter';
import { SpatialCadEnvironmentAdapter } from '../adapters/spatialCadEnvironmentAdapter';
import { ApiToolEnvironmentAdapter } from '../adapters/apiToolEnvironmentAdapter';
import { ContinuousEnvironmentCiiTracker } from '../benchmark/continuousEnvironmentCiiTracker';
import { CubiOEvolutionaryLearningEngine } from '../../evolution/memory/evolutionaryLearningEngine';

const nowMs = (): number =>
  typeof globalThis !== 'undefined' && globalThis.performance && typeof globalThis.performance.now === 'function'
    ? globalThis.performance.now()
    : Date.now();

export class CubiOEmbodiedCycleEngine implements IEmbodiedCycleEngine {
  private workspaceAdapter = new WorkspaceEnvironmentAdapter();
  private spatialAdapter = new SpatialCadEnvironmentAdapter();
  private apiToolAdapter = new ApiToolEnvironmentAdapter();
  private ciiTracker = new ContinuousEnvironmentCiiTracker();
  private memoryEngine = new CubiOEvolutionaryLearningEngine();

  public async executeEmbodiedCycle(
    environmentType: EnvironmentType,
    goal: string,
    actionPayload: Record<string, unknown>
  ): Promise<EmbodiedCycleExecutionReport> {
    const cycleId = `CYCLE_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const startTime = nowMs();

    // 1. Stage 1: PERCEIVE
    const targetUri = (actionPayload.targetUri as string) || `env://${environmentType.toLowerCase()}`;
    const perception = await this.perceiveEnvironment(environmentType, targetUri);

    // 2. Stage 2: PLAN
    const plan: EmbodiedPlan = Object.freeze({
      planId: `PLAN_${Date.now()}`,
      goal,
      actionSteps: Object.freeze([
        `1. Inspect state in ${environmentType}`,
        `2. Execute controlled modification`,
        `3. Verify physical/mathematical invariant`,
      ]),
      estimatedRiskScore: 0.05,
      requiresHumanAuthorization: actionPayload.requiresAuth === true,
      planChecksum: deterministicHash(`${cycleId}:${goal}:${environmentType}`),
    });

    // 3. Stage 3: ACT
    const action: EmbodiedAction = Object.freeze({
      actionId: `ACT_${Date.now()}`,
      environmentType,
      operationType: (actionPayload.operationType as any) || 'EXECUTE',
      targetResource: targetUri,
      payload: Object.freeze(actionPayload),
      authToken: actionPayload.authToken as string | undefined,
    });

    // 4. Stage 4: OBSERVE
    const observation = await this.executeActionInEnvironment(environmentType, action);

    // 5. Stage 5: VERIFY
    const verification = this.verifyObservationInEnvironment(environmentType, observation);

    // 6. Stage 6: LEARN
    const memoryRecord = await this.memoryEngine.ingestSolutionPattern({
      title: `Embodied Rule: ${goal}`,
      domain: environmentType,
      keywords: ['embodied', environmentType.toLowerCase(), 'learned_pattern'],
      solutionCodeOrOutput: JSON.stringify(observation.resultingState),
      sourceProjectId: cycleId,
      confidenceScore: verification.passed ? 0.99 : 0.4,
    });

    const learning: LearningArtifact = Object.freeze({
      memoryId: memoryRecord.memoryId,
      distilledRuleOrPattern: `Learned optimal interaction pattern for ${environmentType}`,
      resonanceScore: memoryRecord.resonanceScore,
      savedToMerkleStore: true,
    });

    // 7. Stage 7: IMPROVE (Record continuous empirical CII snapshot)
    const latencyMs = nowMs() - startTime;
    const ciiSnapshot = this.ciiTracker.recordInteraction(environmentType, verification, latencyMs);

    const cycleCompletedSuccessfully = verification.passed;
    const cycleSealHash = deterministicHash(
      `${cycleId}:${environmentType}:${goal}:${verification.qualityScore}:${cycleCompletedSuccessfully}`
    );

    return Object.freeze({
      cycleId,
      environmentType,
      taskGoal: goal,
      perception,
      plan,
      action,
      observation,
      verification,
      learning,
      ciiSnapshot,
      cycleCompletedSuccessfully,
      cycleSealHash,
      totalTurnaroundLatencyMs: parseFloat(latencyMs.toFixed(2)),
      timestamp: Date.now(),
    });
  }

  private async perceiveEnvironment(
    environmentType: EnvironmentType,
    targetUri: string
  ): Promise<EnvironmentPerception> {
    switch (environmentType) {
      case 'WORKSPACE_FILESYSTEM':
      case 'TYPESCRIPT_CODEBASE':
        return this.workspaceAdapter.perceiveWorkspace(targetUri);
      case 'SPATIAL_3D_CAD':
        return this.spatialAdapter.perceiveScene(targetUri);
      case 'GOVERNED_API_TOOLS':
      default:
        return this.apiToolAdapter.perceiveToolRegistry(targetUri);
    }
  }

  private async executeActionInEnvironment(
    environmentType: EnvironmentType,
    action: EmbodiedAction
  ): Promise<EnvironmentObservation> {
    switch (environmentType) {
      case 'WORKSPACE_FILESYSTEM':
      case 'TYPESCRIPT_CODEBASE':
        return this.workspaceAdapter.executeAction(action);
      case 'SPATIAL_3D_CAD':
        return this.spatialAdapter.executeAction(action);
      case 'GOVERNED_API_TOOLS':
      default:
        return this.apiToolAdapter.executeAction(action);
    }
  }

  private verifyObservationInEnvironment(
    environmentType: EnvironmentType,
    observation: EnvironmentObservation
  ): InvariantVerification {
    switch (environmentType) {
      case 'WORKSPACE_FILESYSTEM':
      case 'TYPESCRIPT_CODEBASE':
        return this.workspaceAdapter.verifyObservation(observation);
      case 'SPATIAL_3D_CAD':
        return this.spatialAdapter.verifyObservation(observation);
      case 'GOVERNED_API_TOOLS':
      default:
        return this.apiToolAdapter.verifyObservation(observation);
    }
  }
}
