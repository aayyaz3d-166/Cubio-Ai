/**
 * CUBiO AI — 3D Memory Studio
 * Task 27 — Native Project Manager Agent (PMA)
 * src/cubio/language/native/pma/projectNavigator.ts
 *
 * Master Navigation Layer.
 * Leverages Master Forensic Index and Subsystem Directories for targeted
 * file discovery without scanning 26,605+ repository artifacts on normal tasks.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PMATaskRequest, PMASubsystemScope, PMATaskType } from './types';

export interface SubsystemDefinition {
  readonly id: string;
  readonly name: string;
  readonly primaryDir: string;
  readonly keyFiles: readonly string[];
  readonly tests: readonly string[];
  readonly reports: readonly string[];
  readonly keywords: readonly string[];
  readonly isFrozen: boolean;
}

export class ProjectNavigator {
  private readonly rootDir: string;
  private readonly subsystems: ReadonlyMap<string, SubsystemDefinition>;

  constructor(customRootDir?: string) {
    this.rootDir = customRootDir || process.cwd();
    this.subsystems = this.initializeSubsystemCatalog();
  }

  private initializeSubsystemCatalog(): Map<string, SubsystemDefinition> {
    const catalog = new Map<string, SubsystemDefinition>();

    catalog.set('SPATIAL_369', {
      id: 'SPATIAL_369',
      name: 'Spatial 369 Core Authority',
      primaryDir: 'src/core',
      keyFiles: ['src/core/address369.ts', 'src/core/canonicalIdentity.ts'],
      tests: ['src/test_spatial_343_369_mapping.ts', 'src/test_phase8_regression_lock.ts'],
      reports: ['reports/tasks/TASK04_SPATIAL_369_REPORT.md'],
      keywords: ['369', 'formula a', '343', 'cellid', 'spatial address', 'coordinate', 'voxel'],
      isFrozen: true,
    });

    catalog.set('DATABASE_VDB', {
      id: 'DATABASE_VDB',
      name: 'Canonical SQLite Sparse Memory VDB',
      primaryDir: 'data',
      keyFiles: ['data/cubio_studio.db'],
      tests: ['src/test_phase8_regression_lock.ts'],
      reports: ['phase8_baseline_manifest.json'],
      keywords: ['database', 'sqlite', 'vdb', 'cubio_studio.db', 'sparse memory', 'records'],
      isFrozen: true,
    });

    catalog.set('NATIVE_VISION', {
      id: 'NATIVE_VISION',
      name: 'Native Discrete Vision DSP',
      primaryDir: 'src/cubio/vision/native',
      keyFiles: ['src/cubio/vision/native/nativeVisionEngine.ts'],
      tests: ['src/test_native_vision_representation.ts'],
      reports: ['reports/tasks/TASK114_NATIVE_VISION_REPRESENTATION_REPORT.md'],
      keywords: ['vision', 'visual', 'luminance', 'sobel', 'patch', 'image', 'tokens', 'dsp'],
      isFrozen: false,
    });

    catalog.set('NATIVE_AUDIO', {
      id: 'NATIVE_AUDIO',
      name: 'Native Acoustic DSP & Allen Algebra',
      primaryDir: 'src/cubio/audio/native',
      keyFiles: ['src/cubio/audio/native/nativeAudioEngine.ts'],
      tests: ['src/test_native_audio_representation.ts'],
      reports: ['reports/tasks/TASK124_NATIVE_AUDIO_REPRESENTATION_REPORT.md'],
      keywords: ['audio', 'sound', 'acoustic', 'hann', 'dft', 'allen temporal', 'pcm'],
      isFrozen: false,
    });

    catalog.set('MULTIMODAL_FUSION', {
      id: 'MULTIMODAL_FUSION',
      name: 'Multimodal Fusion & Joint Representation',
      primaryDir: 'src/cubio/multimodal/native',
      keyFiles: [
        'src/cubio/multimodal/native/multimodalFusionEngine.ts',
        'src/cubio/multimodal/native/multimodalFusionStore.ts',
        'src/cubio/multimodal/native/multimodalFusionTypes.ts',
      ],
      tests: ['src/test_native_multimodal_fusion.ts'],
      reports: ['reports/tasks/TASK128_NATIVE_MULTIMODAL_FUSION_REPORT.md'],
      keywords: ['fusion', 'joint representation', 'cross-modal fusion', 'multimodal'],
      isFrozen: true,
    });

    catalog.set('CROSS_MODAL_GRAPH', {
      id: 'CROSS_MODAL_GRAPH',
      name: 'Cross-Modal Knowledge Graph',
      primaryDir: 'src/cubio/multimodal/native/graph',
      keyFiles: ['src/cubio/multimodal/native/graph/crossModalGraphEngine.ts'],
      tests: ['src/test_native_cross_modal_knowledge_graph.ts'],
      reports: ['reports/tasks/TASK129_NATIVE_CROSS_MODAL_KNOWLEDGE_GRAPH_REPORT.md'],
      keywords: ['graph', 'cross-modal graph', 'relation', 'edge', 'node', 'knowledge graph'],
      isFrozen: false,
    });

    catalog.set('MEMORY_CONSOLIDATION', {
      id: 'MEMORY_CONSOLIDATION',
      name: 'Multimodal Memory Consolidation',
      primaryDir: 'src/cubio/multimodal/native/consolidation',
      keyFiles: ['src/cubio/multimodal/native/consolidation/multimodalConsolidationEngine.ts'],
      tests: ['src/test_native_multimodal_consolidation.ts'],
      reports: ['reports/tasks/TASK130_NATIVE_MULTIMODAL_CONSOLIDATION_REPORT.md'],
      keywords: ['consolidation', 'deduplication', 'compaction', 'temporal consolidation'],
      isFrozen: false,
    });

    catalog.set('HYPOTHESIS_REASONING', {
      id: 'HYPOTHESIS_REASONING',
      name: 'Epistemic Hypothesis Verification Engine',
      primaryDir: 'src/cubio/multimodal/native/hypothesis',
      keyFiles: ['src/cubio/multimodal/native/hypothesis/multimodalHypothesisEngine.ts'],
      tests: ['src/test_native_multimodal_hypothesis_verification.ts'],
      reports: ['reports/tasks/TASK131_MULTIMODAL_HYPOTHESIS_VERIFICATION_REPORT.md'],
      keywords: ['hypothesis', 'epistemic', 'corroboration', 'fact_verified', 'inferred'],
      isFrozen: false,
    });

    catalog.set('GENERALIZATION', {
      id: 'GENERALIZATION',
      name: 'Multimodal Generalization (N >= 3 Anti-Over-Extrapolation)',
      primaryDir: 'src/cubio/multimodal/native/generalization',
      keyFiles: ['src/cubio/multimodal/native/generalization/multimodalGeneralizationEngine.ts'],
      tests: ['src/test_native_multimodal_generalization.ts'],
      reports: ['reports/tasks/TASK132_MULTIMODAL_GENERALIZATION_REPORT.md'],
      keywords: ['generalization', 'induction', 'n >= 3', 'pattern induction', 'extrapolation'],
      isFrozen: false,
    });

    catalog.set('RUNTIME_OPTIMIZER', {
      id: 'RUNTIME_OPTIMIZER',
      name: 'Dual-Key Multimodal Runtime Optimizer',
      primaryDir: 'src/cubio/multimodal/native/optimization',
      keyFiles: ['src/cubio/multimodal/native/optimization/multimodalRuntimeOptimizer.ts'],
      tests: ['src/test_native_multimodal_optimization.ts'],
      reports: ['reports/tasks/TASK133_MULTIMODAL_OPTIMIZATION_REPORT.md'],
      keywords: ['optimizer', 'dual-key', 'inverted index', 'lru', 'cache', 'zero-allocation'],
      isFrozen: false,
    });

    catalog.set('SAFETY_BOUNDARY', {
      id: 'SAFETY_BOUNDARY',
      name: 'Safety Boundary, Adversarial Interceptor & OutputGuard',
      primaryDir: 'src/cubio/multimodal/native/safety',
      keyFiles: [
        'src/cubio/multimodal/native/safety/multimodalSafetyGuard.ts',
        'src/cubio/inference/safety/outputGuard.ts',
      ],
      tests: [
        'src/test_native_multimodal_safety_boundary.ts',
        'src/test_phase8_regression_lock.ts',
      ],
      reports: ['TASK134_MULTIMODAL_SAFETY_REPORT.md', 'PHASE8_FINAL_GATE_REPORT.md'],
      keywords: ['safety', 'actuation', 'lockout', 'adversarial', 'outputguard', 'fail-closed'],
      isFrozen: true,
    });

    catalog.set('GOLDEN_PATH', {
      id: 'GOLDEN_PATH',
      name: '20-Stage Multimodal Golden Path Orchestrator',
      primaryDir: 'src/cubio/multimodal/native/golden_path',
      keyFiles: ['src/cubio/multimodal/native/golden_path/multimodalGoldenPathHarness.ts'],
      tests: ['src/test_phase8_final_gate_master.ts'],
      reports: ['PHASE8_FINAL_GATE_REPORT.md'],
      keywords: ['golden path', '20-stage', 'pipeline', 'end-to-end', 'harness'],
      isFrozen: true,
    });

    catalog.set('ONE_LANGUAGE_NATIVE', {
      id: 'ONE_LANGUAGE_NATIVE',
      name: 'Sovereign Native One Language Engine',
      primaryDir: 'src/cubio/language/native',
      keyFiles: [
        'src/cubio/language/native/index.ts',
        'src/cubio/language/native/nativeTokenizer.ts',
        'src/cubio/language/native/nativeVocabulary.ts',
        'src/cubio/language/native/languageMemoryBridge.ts',
        'src/cubio/language/native/reasoning/nativeLanguageReasoningEngine.ts',
        'src/cubio/language/native/verification/nativeSelfVerifier.ts',
      ],
      tests: [
        'src/test_native_language_representation.ts',
        'src/test_native_language_reasoning.ts',
      ],
      reports: ['reports/architecture/ONE_LANGUAGE_3D_MEMORY_INTEGRATION_MAP.md'],
      keywords: [
        'language',
        'one language',
        'tokenizer',
        'vocabulary',
        'statement parser',
        'selfverifier',
        'semantic grounding',
      ],
      isFrozen: false,
    });

    catalog.set('PROJECT_MANAGER_AGENT', {
      id: 'PROJECT_MANAGER_AGENT',
      name: 'Native Project Manager Agent (PMA)',
      primaryDir: 'src/cubio/language/native/pma',
      keyFiles: [
        'src/cubio/language/native/pma/projectManagerAgent.ts',
        'src/cubio/language/native/pma/pmaPlanner.ts',
        'src/cubio/language/native/pma/projectNavigator.ts',
        'src/cubio/language/native/pma/capabilityResolver.ts',
        'src/cubio/language/native/pma/frozenProtectionGuard.ts',
        'src/cubio/language/native/pma/postDevelopmentVerifier.ts',
        'src/cubio/language/native/pma/projectMemory.ts',
      ],
      tests: ['src/test_pma_native_orchestrator.ts'],
      reports: ['reports/forensic/CUBIO_3D_MEMORY_STUDIO_MASTER_FORENSIC_REPORT.md'],
      keywords: [
        'pma',
        'project manager',
        'orchestrator',
        'handoff',
        'pre-development',
        'post-development',
        'verification',
        'gatekeeper',
      ],
      isFrozen: false,
    });

    return catalog;
  }

  /**
   * Evaluates whether a task requires full-repository exploration or targeted index lookup.
   */
  public evaluateExplorationScope(request: PMATaskRequest, taskType: PMATaskType): {
    requiresFullScan: boolean;
    reason?: string;
  } {
    if (request.explicitFullProjectScan) {
      return {
        requiresFullScan: true,
        reason: 'Explicit full-project scan requested by caller',
      };
    }

    if (taskType === 'ARCHITECTURAL') {
      return {
        requiresFullScan: true,
        reason: 'Architectural changes have wide structural repercussions across layers',
      };
    }

    if (taskType === 'CROSS_SUBSYSTEM') {
      return {
        requiresFullScan: true,
        reason: 'Cross-subsystem workflows span multiple component boundaries',
      };
    }

    if (taskType === 'SECURITY') {
      return {
        requiresFullScan: true,
        reason: 'Security and sovereignty audits require repository-wide verification',
      };
    }

    if (taskType === 'MIGRATION') {
      return {
        requiresFullScan: true,
        reason: 'Migration tasks potentially affect schema, bindings, and data formats',
      };
    }

    if (taskType === 'UNKNOWN') {
      return {
        requiresFullScan: true,
        reason: 'Scope is ambiguous or undefined; full repository exploration triggered for safety',
      };
    }

    return {
      requiresFullScan: false,
      reason: 'Standard scoped development task: using Master Forensic Index for fast targeted exploration',
    };
  }

  /**
   * Resolves relevant subsystems and key source files using the Master Navigation Layer.
   */
  public resolveSubsystemScope(
    request: PMATaskRequest,
    taskType: PMATaskType
  ): PMASubsystemScope {
    const promptLower = request.userPrompt.toLowerCase();
    const matchedSubsystemIds = new Set<string>();

    // 1. Check explicitly passed targetSubsystems and score keyword specificity
    const scoredSubsystems: { id: string; score: number }[] = [];

    for (const [id, def] of this.subsystems.entries()) {
      let score = 0;
      if (request.targetSubsystems?.includes(id)) {
        score += 1000;
      }
      for (const kw of def.keywords) {
        if (promptLower.includes(kw)) {
          // Weight longer, more specific keywords higher
          score += kw.length * 10;
        }
      }
      if (score > 0) {
        scoredSubsystems.push({ id, score });
      }
    }

    // Sort descending by specificity score
    scoredSubsystems.sort((a, b) => b.score - a.score);
    for (const item of scoredSubsystems) {
      matchedSubsystemIds.add(item.id);
    }

    // Fallback: If no match found, assign ONE_LANGUAGE_NATIVE or UNKNOWN
    if (matchedSubsystemIds.size === 0) {
      if (taskType === 'SIMPLE' || taskType === 'INVESTIGATION') {
        matchedSubsystemIds.add('ONE_LANGUAGE_NATIVE');
      }
    }

    const { requiresFullScan, reason } = this.evaluateExplorationScope(request, taskType);

    const affectedSubsystems = Array.from(matchedSubsystemIds);
    const primarySubsystem = affectedSubsystems[0] || 'GENERAL';

    const relevantFilesSet = new Set<string>();
    for (const subId of affectedSubsystems) {
      const def = this.subsystems.get(subId);
      if (def) {
        for (const file of def.keyFiles) {
          relevantFilesSet.add(file);
        }
        for (const test of def.tests) {
          relevantFilesSet.add(test);
        }
      }
    }

    return {
      primarySubsystem,
      affectedSubsystems: Object.freeze(affectedSubsystems),
      relevantFiles: Object.freeze(Array.from(relevantFilesSet)),
      fullProjectExplorationTriggered: requiresFullScan,
      triggerReason: reason,
    };
  }

  /**
   * Returns metadata for all registered subsystems.
   */
  public getAllSubsystems(): readonly SubsystemDefinition[] {
    return Object.freeze(Array.from(this.subsystems.values()));
  }

  /**
   * Returns a specific subsystem by ID.
   */
  public getSubsystem(id: string): SubsystemDefinition | undefined {
    return this.subsystems.get(id);
  }
}
