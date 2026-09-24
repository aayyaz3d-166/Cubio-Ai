/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-002 — DRA (Dependency & Reuse Agent)
 * src/cubio/agents/dra/duplicateDetector.ts
 *
 * Anti-duplication detector and capability collision auditor.
 * Identifies attempts to create duplicate databases, spatial addressers,
 * or existing subsystem engines before development commences.
 */

import { DRAConflictWarning, DRATaskQuery } from './types';

export class DRADuplicateDetector {
  /**
   * Scans query prompt, proposed files, and subsystems for duplicate creation risks.
   */
  public static detectDuplicates(query: DRATaskQuery): readonly DRAConflictWarning[] {
    const warnings: DRAConflictWarning[] = [];
    const promptLower = query.prompt.toLowerCase();
    const proposed = (query.proposedFiles || []).map((f) => f.toLowerCase());

    // 1. Spatial 369 Address duplication
    const hasSpatialDuplicatePrompt =
      /\b(?:new|create|implement|build|add|scaffold)\b/i.test(promptLower) &&
      /\b(?:369|formula a|cellid|address369|spatial lattice|coordinate map)\b/i.test(promptLower) &&
      /\b(?:mapper|core|implementation|algebra|grid|math)\b/i.test(promptLower);

    const hasSpatialDuplicateFile = proposed.some(
      (f) =>
        f.includes('address369') ||
        f.includes('spatial369') ||
        f.includes('cellmapping') ||
        f.includes('coordinate369')
    );

    if (hasSpatialDuplicatePrompt || hasSpatialDuplicateFile) {
      warnings.push({
        type: 'DUPLICATE_IMPLEMENTATION',
        severity: 'CRITICAL',
        target: 'src/core/address369.ts',
        reason: 'Attempting to create a duplicate 369 spatial addressing or coordinate mapping engine.',
        impact:
          'Violates Section 10: src/core/address369.ts is the frozen canonical spatial lattice authority (Delta = 0).',
        safeAlternatives: [
          'Import coordinateToCellId and cellIdToAddress369 from src/core/address369.ts',
          'Use existing Spatial 369 Core Authority without recreating lattice math',
        ],
      });
    }

    // 2. Vector Database / Sparse Memory duplication
    const hasVdbDuplicatePrompt =
      /\b(?:new|create|implement|build|add)\b/i.test(promptLower) &&
      /\b(?:database|vdb|vector store|sparse memory|sqlite store)\b/i.test(promptLower) &&
      !promptLower.includes('query') &&
      !promptLower.includes('read') &&
      !promptLower.includes('reference');

    const hasVdbDuplicateFile = proposed.some(
      (f) =>
        (f.endsWith('.db') || f.includes('sqlite') || f.includes('vectordb')) &&
        !f.includes('test_')
    );

    if (hasVdbDuplicatePrompt || hasVdbDuplicateFile) {
      warnings.push({
        type: 'DUPLICATE_IMPLEMENTATION',
        severity: 'CRITICAL',
        target: 'data/cubio_studio.db',
        reason: 'Attempting to construct a parallel SQLite database or duplicate vector store.',
        impact:
          'Violates Section 11: data/cubio_studio.db is the primary frozen vector authority (77,824 B, Delta = 0).',
        safeAlternatives: [
          'Query data/cubio_studio.db via read-only reference pointers (REFERENCE_POINTER_ONLY)',
          'Leverage AGENT-001 (MEA) for bounded on-demand context extraction',
        ],
      });
    }

    // 3. Language Tokenizer / Vocabulary duplication
    const hasTokenizerDuplicatePrompt =
      /\b(?:new|create|implement|build)\b/i.test(promptLower) &&
      /\b(?:tokenizer|vocabulary|wordpiece|bpe tokenizer)\b/i.test(promptLower) &&
      !promptLower.includes('agent');

    const hasTokenizerDuplicateFile = proposed.some(
      (f) => f.includes('tokenizer') && !f.includes('nativeTokenizer') && !f.includes('test_')
    );

    if (hasTokenizerDuplicatePrompt || hasTokenizerDuplicateFile) {
      warnings.push({
        type: 'DUPLICATE_IMPLEMENTATION',
        severity: 'HIGH',
        target: 'src/cubio/language/native/nativeTokenizer.ts',
        reason: 'Attempting to create a duplicate sovereign language tokenizer.',
        impact:
          'Redundant lexical parsing engine; existing tokenizer in One Language covers discrete tokenization.',
        safeAlternatives: [
          'Import NativeTokenizer from src/cubio/language/native/nativeTokenizer.ts',
        ],
      });
    }

    // 4. Safety Guard / Actuation Lockout duplication
    const hasSafetyDuplicate = proposed.some(
      (f) =>
        (f.includes('safetyguard') || f.includes('outputguard')) &&
        !f.includes('multimodalSafetyGuard') &&
        !f.includes('test_')
    );

    if (hasSafetyDuplicate) {
      warnings.push({
        type: 'DUPLICATE_IMPLEMENTATION',
        severity: 'CRITICAL',
        target: 'src/cubio/multimodal/native/safety/multimodalSafetyGuard.ts',
        reason: 'Attempting to create a parallel safety guard or output filter.',
        impact: 'Violates Section 13: Safety Guard and permanent actuation lockout are frozen invariants.',
        safeAlternatives: [
          'Reuse MultimodalSafetyGuard and OutputGuard from verified frozen locations',
        ],
      });
    }

    return Object.freeze(warnings);
  }
}
