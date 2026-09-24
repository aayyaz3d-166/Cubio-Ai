/**
 * CUBiO AI — 3D Memory Studio
 * Task 27 — Native Project Manager Agent (PMA)
 * src/cubio/language/native/pma/capabilityResolver.ts
 *
 * Existing Capability Resolution Engine.
 * Resolves project capabilities, evaluates candidate code for reuse vs duplicate creation,
 * and enforces the REUSE -> COMPOSE -> EXTEND -> NEW discipline.
 */

import { PMACandidateCapability, PMAReuseStrategy, PMAConflictRecord } from './types';

export class CapabilityResolver {
  private readonly capabilityRegistry: ReadonlyMap<string, PMACandidateCapability>;

  constructor() {
    this.capabilityRegistry = this.initializeCapabilityRegistry();
  }

  private initializeCapabilityRegistry(): Map<string, PMACandidateCapability> {
    const registry = new Map<string, PMACandidateCapability>();

    registry.set('SPATIAL_369_FORMULA_A', {
      capabilityName: 'Spatial 369 Formula A Mapping',
      path: 'src/core/address369.ts',
      implementation: 'coordinateToCellId, cellIdToAddress369, cellIdToCoordinate, address369ToCellId',
      status: 'FROZEN_AUTHORITY',
      tests: 'src/test_spatial_343_369_mapping.ts',
      dependencies: ['Pure Math'],
      reuseValue: 'MAXIMUM',
      reuseStrategy: 'REUSE',
      notes: 'Immutable canonical spatial lattice index. Competing implementations strictly prohibited.',
    });

    registry.set('SPARSE_MEMORY_VDB', {
      capabilityName: 'Canonical Sparse Memory VDB',
      path: 'data/cubio_studio.db',
      implementation: 'SQLite sparse memory vector database tables: studio_schema_version, studio_records',
      status: 'FROZEN_AUTHORITY',
      tests: 'src/test_phase8_regression_lock.ts',
      dependencies: ['sqlite3', 'fs'],
      reuseValue: 'MAXIMUM',
      reuseStrategy: 'REUSE',
      notes: 'Primary persistent vector memory store. Silent modification blocked.',
    });

    registry.set('NATIVE_VISION_DSP', {
      capabilityName: 'Discrete Native Vision DSP & Tokenizer',
      path: 'src/cubio/vision/native/nativeVisionEngine.ts',
      implementation: 'NativeVisionEngine',
      status: 'CERTIFIED',
      tests: 'src/test_native_vision_representation.ts',
      dependencies: ['src/core/address369.ts'],
      reuseValue: 'HIGH',
      reuseStrategy: 'REUSE',
      notes: '16x16 luminance DSP, Sobel edge filters, 64 discrete visual tokens.',
    });

    registry.set('NATIVE_AUDIO_DSP', {
      capabilityName: 'Discrete Native Audio DSP & Allen Temporal Algebra',
      path: 'src/cubio/audio/native/nativeAudioEngine.ts',
      implementation: 'NativeAudioEngine',
      status: 'CERTIFIED',
      tests: 'src/test_native_audio_representation.ts',
      dependencies: ['Discrete Math', 'SoundUtils'],
      reuseValue: 'HIGH',
      reuseStrategy: 'REUSE',
      notes: 'Hann 8-band DFT, RMS energy analysis, 13 Allen temporal algebra interval relations.',
    });

    registry.set('MULTIMODAL_FUSION', {
      capabilityName: 'Cross-Modal Joint Fusion Engine',
      path: 'src/cubio/multimodal/native/multimodalFusionEngine.ts',
      implementation: 'MultimodalFusionEngine',
      status: 'CERTIFIED',
      tests: 'src/test_native_multimodal_fusion.ts',
      dependencies: ['NativeVisionEngine', 'NativeAudioEngine'],
      reuseValue: 'HIGH',
      reuseStrategy: 'REUSE',
      notes: 'Closed-form cross-modal joint representation in 343-cell lattice.',
    });

    registry.set('CROSS_MODAL_GRAPH', {
      capabilityName: 'Cross-Modal Knowledge Graph',
      path: 'src/cubio/multimodal/native/graph/crossModalGraphEngine.ts',
      implementation: 'CrossModalGraphEngine',
      status: 'CERTIFIED',
      tests: 'src/test_native_cross_modal_knowledge_graph.ts',
      dependencies: ['KnowledgeGraphAuthority'],
      reuseValue: 'HIGH',
      reuseStrategy: 'REUSE',
      notes: 'Cross-modal associative graph traversal and multi-hop relationship extraction.',
    });

    registry.set('MEMORY_CONSOLIDATION', {
      capabilityName: 'Multimodal Memory Consolidation Engine',
      path: 'src/cubio/multimodal/native/consolidation/multimodalConsolidationEngine.ts',
      implementation: 'MultimodalConsolidationEngine',
      status: 'CERTIFIED',
      tests: 'src/test_native_multimodal_consolidation.ts',
      dependencies: ['SparseMemoryStore'],
      reuseValue: 'HIGH',
      reuseStrategy: 'REUSE',
      notes: 'Temporal compaction and deduplication across sensory episodes.',
    });

    registry.set('EPISTEMIC_HYPOTHESIS', {
      capabilityName: 'Epistemic Hypothesis Verification Engine',
      path: 'src/cubio/multimodal/native/hypothesis/multimodalHypothesisEngine.ts',
      implementation: 'MultimodalHypothesisEngine',
      status: 'CERTIFIED',
      tests: 'src/test_native_multimodal_hypothesis_verification.ts',
      dependencies: ['CrossModalGraphEngine'],
      reuseValue: 'HIGH',
      reuseStrategy: 'REUSE',
      notes: 'Epistemic tiering (FACT_VERIFIED vs INFERRED vs HYPOTHETICAL).',
    });

    registry.set('MULTIMODAL_GENERALIZATION', {
      capabilityName: 'Multimodal Generalization Engine (N >= 3)',
      path: 'src/cubio/multimodal/native/generalization/multimodalGeneralizationEngine.ts',
      implementation: 'MultimodalGeneralizationEngine',
      status: 'CERTIFIED',
      tests: 'src/test_native_multimodal_generalization.ts',
      dependencies: ['ConsolidationEngine'],
      reuseValue: 'HIGH',
      reuseStrategy: 'REUSE',
      notes: 'Anti-over-extrapolation defense requiring at least 3 distinct instances for induction.',
    });

    registry.set('RUNTIME_OPTIMIZER', {
      capabilityName: 'Dual-Key Runtime Optimizer',
      path: 'src/cubio/multimodal/native/optimization/multimodalRuntimeOptimizer.ts',
      implementation: 'MultimodalRuntimeOptimizer',
      status: 'CERTIFIED',
      tests: 'src/test_native_multimodal_optimization.ts',
      dependencies: ['ResourceGovernor'],
      reuseValue: 'HIGH',
      reuseStrategy: 'REUSE',
      notes: 'Dual-key inverted indexing and bounded LRU cache paging.',
    });

    registry.set('SAFETY_GUARD', {
      capabilityName: 'Multimodal Safety Guard & OutputGuard',
      path: 'src/cubio/multimodal/native/safety/multimodalSafetyGuard.ts',
      implementation: 'MultimodalSafetyGuard, OutputGuard',
      status: 'FROZEN_PRODUCTION',
      tests: 'src/test_native_multimodal_safety_boundary.ts, src/test_phase8_regression_lock.ts',
      dependencies: ['NativeSelfVerifier'],
      reuseValue: 'MAXIMUM',
      reuseStrategy: 'REUSE',
      notes: 'Intercepts actuation commands; permanent fail-closed hardware lockout.',
    });

    registry.set('NATIVE_LANGUAGE_TOKENIZER', {
      capabilityName: 'Native Sovereign Language Tokenizer & Vocabulary',
      path: 'src/cubio/language/native/nativeTokenizer.ts',
      implementation: 'NativeTokenizer, NativeVocabulary',
      status: 'CERTIFIED',
      tests: 'src/test_native_language_representation.ts',
      dependencies: ['NativeVocabulary'],
      reuseValue: 'HIGH',
      reuseStrategy: 'REUSE',
      notes: 'Offline sovereign tokenization and lexical parsing.',
    });

    registry.set('NATIVE_LANGUAGE_REASONING', {
      capabilityName: 'Native Multi-Step Language Reasoning Engine',
      path: 'src/cubio/language/native/reasoning/nativeLanguageReasoningEngine.ts',
      implementation: 'NativeLanguageReasoningEngine, LanguageStatementParser',
      status: 'CERTIFIED',
      tests: 'src/test_native_language_reasoning.ts',
      dependencies: ['LanguageStatementParser', 'NativeTokenizer'],
      reuseValue: 'HIGH',
      reuseStrategy: 'REUSE',
      notes: 'Deterministic deductive rule execution and epistemic proof DAGs.',
    });

    registry.set('NATIVE_SELF_VERIFIER', {
      capabilityName: 'Native Self-Verifier & Hallucination Prevention',
      path: 'src/cubio/language/native/verification/nativeSelfVerifier.ts',
      implementation: 'NativeSelfVerifier',
      status: 'CERTIFIED',
      tests: 'src/test_phase8_regression_lock.ts',
      dependencies: ['ClaimExtractor'],
      reuseValue: 'MAXIMUM',
      reuseStrategy: 'REUSE',
      notes: 'Sovereign candidate emission verification and claim grounding.',
    });

    return registry;
  }

  /**
   * Searches the capability registry for matching implementations.
   */
  public resolveCapabilitiesForTask(
    userPrompt: string,
    subsystemIds: readonly string[]
  ): {
    matchedCapabilities: readonly PMACandidateCapability[];
    primaryStrategy: PMAReuseStrategy;
    potentialDuplicates: readonly PMAConflictRecord[];
  } {
    const promptLower = userPrompt.toLowerCase();
    const matched: PMACandidateCapability[] = [];
    const duplicates: PMAConflictRecord[] = [];

    // Check for duplicate creation attempts
    if (
      /\b(?:new|create|implement|build|add)\b/i.test(promptLower) &&
      /\b(?:369|formula a|cellid|address369)\b/i.test(promptLower) &&
      /\b(?:mapper|core|implementation|coordinate mapping|lattice)\b/i.test(promptLower)
    ) {
      duplicates.push({
        type: 'DUPLICATE_IMPLEMENTATION',
        component: 'src/core/address369.ts',
        reason: 'Attempting to create a duplicate 369 spatial addressing implementation.',
        impact: 'Violates Section 10: address369.ts is the canonical authority (Delta = 0).',
        safeAlternatives: ['Import and reuse coordinateToCellId and cellIdToAddress369 from src/core/address369.ts'],
      });
    }

    if (
      /\b(?:new|create|implement|build|add)\b/i.test(promptLower) &&
      /\b(?:database|vdb|sparse memory store|sqlite)\b/i.test(promptLower) &&
      /\b(?:engine|store|db)\b/i.test(promptLower) &&
      !promptLower.includes('query') &&
      !promptLower.includes('read')
    ) {
      duplicates.push({
        type: 'DUPLICATE_IMPLEMENTATION',
        component: 'data/cubio_studio.db',
        reason: 'Attempting to create a parallel or duplicate database / vector store.',
        impact: 'Violates Section 11: data/cubio_studio.db is the primary persistent authority.',
        safeAlternatives: ['Use the canonical SQLite database data/cubio_studio.db via existing store interfaces'],
      });
    }

    // Match existing capabilities based on prompt keywords & subsystem IDs
    for (const [id, cap] of this.capabilityRegistry.entries()) {
      let isMatch = false;

      if (subsystemIds.includes('SPATIAL_369') && id === 'SPATIAL_369_FORMULA_A') isMatch = true;
      if (subsystemIds.includes('DATABASE_VDB') && id === 'SPARSE_MEMORY_VDB') isMatch = true;
      if (subsystemIds.includes('NATIVE_VISION') && id === 'NATIVE_VISION_DSP') isMatch = true;
      if (subsystemIds.includes('NATIVE_AUDIO') && id === 'NATIVE_AUDIO_DSP') isMatch = true;
      if (subsystemIds.includes('MULTIMODAL_FUSION') && id === 'MULTIMODAL_FUSION') isMatch = true;
      if (subsystemIds.includes('CROSS_MODAL_GRAPH') && id === 'CROSS_MODAL_GRAPH') isMatch = true;
      if (subsystemIds.includes('MEMORY_CONSOLIDATION') && id === 'MEMORY_CONSOLIDATION') isMatch = true;
      if (subsystemIds.includes('HYPOTHESIS_REASONING') && id === 'EPISTEMIC_HYPOTHESIS') isMatch = true;
      if (subsystemIds.includes('GENERALIZATION') && id === 'MULTIMODAL_GENERALIZATION') isMatch = true;
      if (subsystemIds.includes('RUNTIME_OPTIMIZER') && id === 'RUNTIME_OPTIMIZER') isMatch = true;
      if (subsystemIds.includes('SAFETY_BOUNDARY') && id === 'SAFETY_GUARD') isMatch = true;
      if (subsystemIds.includes('ONE_LANGUAGE_NATIVE') && (id.startsWith('NATIVE_LANGUAGE') || id === 'NATIVE_SELF_VERIFIER')) isMatch = true;

      // Lexical check
      if (
        promptLower.includes(cap.capabilityName.toLowerCase()) ||
        cap.implementation.toLowerCase().split(', ').some((impl) => promptLower.includes(impl.toLowerCase()))
      ) {
        isMatch = true;
      }

      if (isMatch && !matched.some((m) => m.capabilityName === cap.capabilityName)) {
        matched.push(cap);
      }
    }

    // Determine primary strategy
    let primaryStrategy: PMAReuseStrategy = 'REUSE';
    if (matched.length > 1) {
      primaryStrategy = 'COMPOSE';
    } else if (matched.length === 1) {
      if (promptLower.includes('extend') || promptLower.includes('enhance') || promptLower.includes('add parameter')) {
        primaryStrategy = 'EXTEND';
      } else {
        primaryStrategy = 'REUSE';
      }
    } else {
      primaryStrategy = 'NEW';
    }

    return {
      matchedCapabilities: Object.freeze(matched),
      primaryStrategy,
      potentialDuplicates: Object.freeze(duplicates),
    };
  }

  /**
   * Retrieves full capability registry.
   */
  public getRegistry(): readonly PMACandidateCapability[] {
    return Object.freeze(Array.from(this.capabilityRegistry.values()));
  }
}
