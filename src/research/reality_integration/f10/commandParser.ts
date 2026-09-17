/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Command Parser
 *
 * Combines Intent Extraction and Context Resolution into a validated ParsedCommand.
 */

import { WorkspaceGeometry } from '../r9/types';
import { AIIntentType, ResolvedContextReference } from './types';
import { SemanticSlots, ParsedUtterance } from './languageTypes';
import { F10IntentEngine } from './intentEngine';
import { F10ContextResolver } from './contextResolver';

export interface ParsedCommand {
  readonly utterance: ParsedUtterance;
  readonly intent: AIIntentType;
  readonly slots: SemanticSlots;
  readonly resolvedTarget: ResolvedContextReference;
  readonly referenceTarget: WorkspaceGeometry | null;
  readonly isActionable: boolean;
}

export class F10CommandParser {
  public static parse(
    rawText: string,
    geometries: Readonly<Record<string, WorkspaceGeometry>>,
    activeTargetId: string | null,
    lastCreatedId: string | null,
    commandId: string
  ): ParsedCommand {
    const utterance = F10IntentEngine.parseUtterance(rawText);
    const slots = utterance.slots;

    const resolvedTarget = F10ContextResolver.resolveTarget(
      slots,
      rawText,
      geometries,
      activeTargetId,
      lastCreatedId,
      commandId
    );

    const referenceTarget = F10ContextResolver.resolveReferenceTarget(
      slots.referenceNoun,
      geometries
    );

    const isActionable = slots.intent !== 'UNKNOWN';

    return {
      utterance,
      intent: slots.intent,
      slots,
      resolvedTarget,
      referenceTarget,
      isActionable,
    };
  }
}
