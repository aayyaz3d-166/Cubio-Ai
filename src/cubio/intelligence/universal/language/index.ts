/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F47: Universal Language Layer Barrel Exports
 */

export type {
  LanguageScript,
  TextDirection,
  LanguageDetectionReport,
  NormalizedText,
  SemanticInterlinguaRepresentation,
  LocalizedResponse,
  ILanguageEngine,
} from './types';
export * from './normalizer';
export * from './detector';
export * from './interlingua';
export * from './localizer';
export * from './languageEngine';
