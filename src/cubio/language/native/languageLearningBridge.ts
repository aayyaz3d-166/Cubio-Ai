/**
 * CUBiO AI — Phase 6: Task 74
 * Native Language Representation Layer
 * src/cubio/language/native/languageLearningBridge.ts
 *
 * Bridge connecting Native Language Representation to Phase 5 Learning (AdaptationCore)
 * and Native Information Reasoning Engine.
 * Translates language sequences into validated learning samples and reasoning premises
 * with strict preservation of epistemic tri-state classification.
 */

import * as crypto from 'crypto';
import { LearningInputSample } from '../../learning/native/learningTypes';
import { EpistemicFact } from '../../epistemic/native/epistemicTypes';
import {
  ReasoningPremise,
  PremiseType,
  EpistemicStatus as ReasoningEpistemicStatus,
} from '../../reasoning/native/reasoningTypes';
import {
  NativeLanguageSequence,
  LanguageRepresentationError,
} from './languageTypes';

export class LanguageLearningBridge {
  /**
   * Converts a NativeLanguageSequence into a validated LearningInputSample for AdaptationCore.
   */
  public static toLearningInputSample(
    sequence: NativeLanguageSequence,
    targetValues?: readonly number[],
    targetClass?: number
  ): LearningInputSample {
    const isFact = sequence.epistemicStatus === 'CANONICAL_FACT';
    const isUnknown = sequence.epistemicStatus === 'EPISTEMIC_UNKNOWN';
    const confidence = isFact ? 1.0 : (isUnknown ? 0.0 : 0.85);

    // Derived target values from embedding if not explicitly provided
    const targets = targetValues ?? Array.from(sequence.embedding.slice(0, 8));

    return Object.freeze({
      sampleId: `sample_${sequence.sequenceId.replace('seq_', '')}`,
      objectId: sequence.objectId,
      tenantId: sequence.tenantId,
      stateVersion: sequence.stateVersion,
      checksum: sequence.checksum,
      domain: sequence.domain,
      cellId: sequence.spatialCellIds.length > 0 ? sequence.spatialCellIds[0] : 0,
      epistemicStatus: sequence.epistemicStatus,
      confidence,
      modality: 'TEXT' as const,
      payload: Object.freeze({
        rawText: sequence.rawText,
        tokensCount: sequence.length,
        embedding: Array.from(sequence.embedding),
      }),
      targetValues: Object.freeze(targets),
      targetClass: targetClass ?? 0,
      label: sequence.rawText.slice(0, 32),
      timestamp: sequence.timestamps.createdAt,
    });
  }

  /**
   * Converts a NativeLanguageSequence into structured ReasoningPremise objects for reasoning.
   */
  public static toReasoningPremises(sequence: NativeLanguageSequence): ReasoningPremise[] {
    const text = sequence.rawText.trim();
    const premises: ReasoningPremise[] = [];

    // Parse simple statement: e.g. "Subject is Object", "Subject has Object", "Subject in Object"
    const parsed = LanguageLearningBridge._parseStatement(text);

    let premiseType: PremiseType = 'OBSERVED_FACT';
    let reasoningStatus: ReasoningEpistemicStatus = 'ESTABLISHED_FACT';
    let confidence = 1.0;

    if (sequence.epistemicStatus === 'SUPPORTED_HYPOTHESIS') {
      reasoningStatus = 'SUPPORTED_HYPOTHESIS';
      confidence = 0.85;
    } else if (sequence.epistemicStatus === 'EPISTEMIC_UNKNOWN') {
      reasoningStatus = 'UNSUPPORTED';
      confidence = 0.0;
    } else if (sequence.epistemicStatus === 'PROVISIONAL_ASSUMPTION') {
      reasoningStatus = 'UNSUPPORTED';
      confidence = 0.45;
    }

    const premiseId = `premise_${sequence.sequenceId.replace('seq_', '')}_0`;

    premises.push(
      Object.freeze({
        premiseId,
        type: premiseType,
        statement: sequence.rawText,
        subject: parsed.subject,
        predicate: parsed.predicate,
        object: parsed.object,
        confidence,
        epistemicStatus: reasoningStatus,
        sourceObjectId: sequence.objectId,
        sourceStorageKey: `${sequence.tenantId}:${sequence.objectId}`,
        timestamp: sequence.timestamps.createdAt,
      })
    );

    return premises;
  }

  /**
   * Converts a verified language sequence into a formal EpistemicFact.
   * Throws an error if the statement is UNKNOWN or contradictory.
   */
  public static toEpistemicFact(sequence: NativeLanguageSequence): EpistemicFact {
    if (sequence.epistemicStatus !== 'CANONICAL_FACT') {
      throw new LanguageRepresentationError(
        `Cannot create EpistemicFact from non-factual sequence status: ${sequence.epistemicStatus}`
      );
    }

    const parsed = LanguageLearningBridge._parseStatement(sequence.rawText);

    return Object.freeze({
      mathType: 'EPISTEMIC_FACT',
      id: `fact_${sequence.sequenceId.replace('seq_', '')}`,
      tenantId: sequence.tenantId,
      domain: sequence.domain,
      statement: sequence.rawText,
      subject: parsed.subject,
      predicate: parsed.predicate,
      value: parsed.object,
      epistemicType: 'FACT',
      epistemicStatus: 'CANONICAL_FACT',
      confidence: 1.0,
      provenanceId: sequence.provenanceId,
      timestamp: sequence.timestamps.createdAt,
      checksum: sequence.checksum,
    });
  }

  /**
   * Helper extracting subject, predicate, and object from simple linguistic patterns.
   */
  private static _parseStatement(text: string): { subject: string; predicate: string; object: string } {
    // Strip epistemic prefixes
    let clean = text
      .replace(/^\[FACT\]\s*/i, '')
      .replace(/^FACT:\s*/i, '')
      .replace(/^\[EVIDENCE\]\s*/i, '')
      .replace(/^EVIDENCE:\s*/i, '')
      .replace(/^\[HYPOTHESIS\]\s*/i, '')
      .replace(/^HYPOTHESIS:\s*/i, '')
      .replace(/^\[UNKNOWN\]\s*/i, '')
      .replace(/^UNKNOWN:\s*/i, '')
      .trim();

    const parts = clean.split(/\s+/);
    if (parts.length >= 3) {
      const subject = parts[0];
      const predicate = parts[1].toLowerCase();
      const object = parts.slice(2).join(' ').replace(/[.!?,]$/, '');
      return { subject, predicate, object };
    }

    if (parts.length === 2) {
      return { subject: parts[0], predicate: 'is', object: parts[1] };
    }

    return { subject: clean, predicate: 'exists', object: 'true' };
  }
}
