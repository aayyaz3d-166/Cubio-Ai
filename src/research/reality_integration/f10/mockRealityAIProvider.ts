/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Mock / Deterministic Reality AI Provider (σ² = 0)
 *
 * Fully offline, reproducible spatial intelligence provider.
 */

import { WorkspaceGeometry } from '../r9/types';
import { RealityAIProvider } from './realityAIProvider';
import { SpatialCommandPlan, ResolvedContextReference, AIExplanation } from './types';
import { ParsedUtterance } from './languageTypes';
import { ParsedCommand, F10CommandParser } from './commandParser';
import { F10IntentEngine } from './intentEngine';
import { F10ContextResolver } from './contextResolver';
import { F10CommandPlanner } from './commandPlanner';
import { deterministicHash } from './determinism';

export class MockRealityAIProvider implements RealityAIProvider {
  public readonly providerId = 'PROVIDER_MOCK_DETERMINISTIC';
  public readonly providerName = 'Deterministic Reality AI Engine';
  public readonly isDeterministic = true;

  public async parseUtterance(rawText: string): Promise<ParsedUtterance> {
    return F10IntentEngine.parseUtterance(rawText);
  }

  public async resolveContext(
    utterance: string,
    geometries: Readonly<Record<string, WorkspaceGeometry>>,
    activeTargetId: string | null,
    lastCreatedId: string | null,
    commandId: string
  ): Promise<ResolvedContextReference> {
    const parsed = F10IntentEngine.parseUtterance(utterance);
    return F10ContextResolver.resolveTarget(
      parsed.slots,
      utterance,
      geometries,
      activeTargetId,
      lastCreatedId,
      commandId
    );
  }

  public async generatePlan(
    parsed: ParsedCommand,
    commandId: string,
    sessionId: string,
    realityChecksum: string,
    geometries: Readonly<Record<string, WorkspaceGeometry>>
  ): Promise<SpatialCommandPlan> {
    return F10CommandPlanner.generatePlan(
      parsed,
      commandId,
      sessionId,
      realityChecksum,
      geometries
    );
  }

  public async explainOperation(
    plan: SpatialCommandPlan,
    geometry: WorkspaceGeometry | null
  ): Promise<AIExplanation> {
    const op = plan.operations[0];
    const opSummary = op ? op.description : plan.summary;
    const targetName = geometry ? geometry.identity.name : op?.targetName || 'WORKSPACE';
    const origin = geometry ? geometry.identity.origin : op?.resultingOrigin || 'USER_CONSTRUCTED';

    const hash = `EXP_${deterministicHash(plan.planId + targetName + opSummary)}`;

    return {
      intent: plan.intent,
      targetName,
      referenceName: op?.parameters.referenceTargetId || null,
      spatialRelation: op?.parameters.spatialRelation || null,
      operationSummary: opSummary,
      domain: op?.domain || 'WORKSPACE',
      epistemicClassification: origin,
      realityCoordinates: [5, 3, 6], // Authoritative invariant
      realityMutation: 0,
      deterministicHash: hash,
    };
  }
}
