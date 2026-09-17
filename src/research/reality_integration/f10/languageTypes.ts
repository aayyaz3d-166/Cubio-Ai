/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Language Tokenization & Semantic Grammar Types
 */

import { GeometryPrimitiveType, BooleanOperationType, MeasurementType } from '../r9/types';
import { AIIntentType, SpatialRelationType, SpatialAxis } from './types';

export interface LanguageToken {
  readonly text: string;
  readonly normalized: string;
  readonly pos?: 'VERB' | 'NOUN' | 'ADJECTIVE' | 'PREPOSITION' | 'PRONOUN' | 'NUMBER' | 'PUNCTUATION' | 'UNKNOWN';
}

export interface SemanticSlots {
  readonly intent: AIIntentType;
  readonly primitive?: GeometryPrimitiveType;
  readonly quantity?: number;
  readonly targetNoun?: string;
  readonly pronoun?: 'IT' | 'THAT' | 'THIS' | 'THEM' | 'ALL';
  readonly spatialRelation?: SpatialRelationType;
  readonly referenceNoun?: string;
  readonly distance?: number;
  readonly unit?: string;
  readonly axis?: SpatialAxis;
  readonly direction?: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'FORWARD' | 'BACKWARD';
  readonly degrees?: number;
  readonly scaleFactor?: number;
  readonly booleanOp?: BooleanOperationType;
  readonly measurementType?: MeasurementType;
  readonly queryType?: 'LOCATION' | 'ORIGIN' | 'DIMENSION' | 'LINEAGE' | 'REALITY' | 'GENERAL';
}

export interface ParsedUtterance {
  readonly rawText: string;
  readonly normalizedText: string;
  readonly tokens: readonly LanguageToken[];
  readonly slots: SemanticSlots;
  readonly parseConfidence: number;
}
