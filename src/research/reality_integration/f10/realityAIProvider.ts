/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Reality AI Provider Interface
 *
 * Pluggable provider abstraction allowing deterministic mock provider or external LLM integration.
 */

import { WorkspaceGeometry } from '../r9/types';
import { SpatialCommandPlan, ResolvedContextReference, AIExplanation } from './types';
import { ParsedUtterance } from './languageTypes';
import { ParsedCommand } from './commandParser';

export interface RealityAIProvider {
  readonly providerId: string;
  readonly providerName: string;
  readonly isDeterministic: boolean;

  parseUtterance(rawText: string): Promise<ParsedUtterance>;

  resolveContext(
    utterance: string,
    geometries: Readonly<Record<string, WorkspaceGeometry>>,
    activeTargetId: string | null,
    lastCreatedId: string | null,
    commandId: string
  ): Promise<ResolvedContextReference>;

  generatePlan(
    parsed: ParsedCommand,
    commandId: string,
    sessionId: string,
    realityChecksum: string,
    geometries: Readonly<Record<string, WorkspaceGeometry>>
  ): Promise<SpatialCommandPlan>;

  explainOperation(
    plan: SpatialCommandPlan,
    geometry: WorkspaceGeometry | null
  ): Promise<AIExplanation>;
}
