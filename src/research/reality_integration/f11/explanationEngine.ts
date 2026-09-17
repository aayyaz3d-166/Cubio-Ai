/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Explanation Engine
 *
 * Converts formal reasoning traces and relation derivations into transparent,
 * evidence-backed human-readable explanations without hallucination.
 *
 * Invariant: Explicitly reports ΔReality = 0.
 */

import {
  WorldEntity,
  WorldRelation,
  ReasoningTrace,
  Evidence,
  Inference,
} from './types';

export interface FormattedExplanation {
  readonly title: string;
  readonly statement: string;
  readonly evidenceType: string;
  readonly method: string;
  readonly premiseSteps: readonly string[];
  readonly realityMutation: 0;
  readonly confidencePercent: number;
}

export class F11ExplanationEngine {
  public static explainRelation(
    relation: WorldRelation,
    entities: Readonly<Record<string, WorldEntity>>,
    inference?: Inference | null
  ): FormattedExplanation {
    const src = entities[relation.sourceEntityId]?.name || relation.sourceEntityId;
    const tgt = entities[relation.targetEntityId]?.name || relation.targetEntityId;

    const statement = `${src} is ${relation.relationType} ${tgt}.`;
    const premiseSteps = inference ? [...inference.reasoningPath] : [relation.evidence.description];

    return {
      title: `Spatial Fact: ${relation.relationType}`,
      statement,
      evidenceType: relation.evidence.evidenceType,
      method: relation.evidence.method,
      premiseSteps: Object.freeze(premiseSteps),
      realityMutation: 0,
      confidencePercent: Math.round(relation.confidence * 100),
    };
  }

  public static explainTrace(trace: ReasoningTrace): FormattedExplanation {
    return {
      title: `Reasoning Trace: ${trace.query}`,
      statement: trace.finalConclusion,
      evidenceType: trace.evidenceChain.steps[0]?.evidenceType || 'DERIVED_FROM_WORLD_MODEL',
      method: trace.steps.map((s) => s.ruleUsed).join(' -> ') || 'DIRECT_LOOKUP',
      premiseSteps: Object.freeze(trace.steps.map((s) => `Step ${s.stepIndex}: ${s.intermediateConclusion}`)),
      realityMutation: 0,
      confidencePercent: 100,
    };
  }
}
