/**
 * CUBiO AI — 3D Memory Studio
 * Task 29 — tinyPMA: Task & Experiment Interpreter
 * src/cubio/language/native/pma/tinyPMA.ts
 *
 * tinyPMA is a lightweight front-layer interpreter/classifier/router
 * sitting INSIDE the existing Native PMA architecture.
 *
 * CANONICAL FLOW:
 *   USER NATURAL-LANGUAGE REQUEST
 *       ↓
 *    tinyPMA.interpretRequest()
 *       ↓
 *   Classify / Extract / Discover
 *       ↓
 *   TinyPMAHandoff (structured)
 *       ↓
 *   CubiOProjectManagerAgent.planTask()
 *
 * SOVEREIGNTY RULES (permanent):
 *   - is_actuation_blocked = true (always)
 *   - No external AI / cloud runtime dependencies
 *   - UNKNOWN classification is explicit (never silently re-mapped)
 *   - All classification is deterministic: given the same prompt,
 *     the same TinyPMARequestType is ALWAYS returned (no randomness)
 *   - Reuses CapabilityResolver and ProjectNavigator — no new registries
 */

import * as crypto from 'crypto';
import { PMATaskType, PMAReuseStrategy } from './types';
import { CapabilityResolver } from './capabilityResolver';
import { ProjectNavigator } from './projectNavigator';
import {
  TinyPMARequestType,
  TinyPMAHandoff,
  TinyPMAExtractedTerms,
  TinyPMARelatedEngine,
  TinyPMARelatedTask,
  TinyPMARelatedExperiment,
  TinyPMARelatedReport,
  TinyPMARiskFactors,
  TinyPMARiskLevel,
  TinyPMAClassificationEvidence,
  TinyPMAClassificationResult,
  TinyPMAToPMATaskTypeMap,
} from './tinyPMATypes';

// ---------------------------------------------------------------------------
// Deterministic keyword-to-type mapping table
// Priority is determined by score (more / longer keywords = higher score).
// Each entry: [type, keywords[]].
// Classification iterates ALL entries and picks the winner by max score.
// ---------------------------------------------------------------------------

const CLASSIFICATION_TABLE: ReadonlyArray<{
  readonly type: TinyPMARequestType;
  readonly keywords: readonly string[];
}> = Object.freeze([
  {
    type: 'EXPERIMENT',
    keywords: [
      'experiment', 'try', 'hypothesis', 'probe', 'feasibility',
      'exploratory', 'spike', 'prototype', 'proof of concept', 'poc',
      'what if', 'explore', 'sandbox', 'investigate approach',
    ],
  },
  {
    type: 'TEST',
    keywords: [
      'test suite', 'test case', 'unit test', 'integration test', 'write test',
      'add test', 'test gate', 'test coverage', 'test scaffold',
      'passing test', 'failing test', 'gate test', 'npx tsx src/test',
    ],
  },
  {
    type: 'RESEARCH',
    keywords: [
      'research', 'study', 'analyze', 'analyse', 'survey', 'literature',
      'understand', 'forensic', 'forensic report', 'master index', 'investigate',
      'capability map', 'discovery', 'what exists', 'what is', 'read the',
    ],
  },
  {
    type: 'BUILD',
    keywords: [
      'build', 'npm run build', 'vite build', 'compile', 'bundle',
      'check build', 'run build', 'verify build',
    ],
  },
  {
    type: 'AUDIT',
    keywords: [
      'audit', 'security audit', 'check frozen', 'check invariant',
      'sovereignty check', 'sha256', 'hash check', 'baseline check',
      'protection audit', 'frozen file', 'db integrity', 'database audit',
    ],
  },
  {
    type: 'BENCHMARK',
    keywords: [
      'benchmark', 'performance benchmark', 'latency test', 'throughput',
      'measure performance', 'profile', 'profiling', 'micro-benchmark',
    ],
  },
  {
    type: 'TRAINING',
    keywords: [
      'train', 'training', 'fine-tune', 'finetune', 'learning rate',
      'epoch', 'dataset', 'ground truth', 'label', 'annotation',
    ],
  },
  {
    type: 'DEBUG',
    keywords: [
      'debug', 'fix bug', 'error', 'exception', 'crash', 'issue',
      'broken', 'not working', 'stack trace', 'diagnose', 'failure',
      'why is', 'broken test',
    ],
  },
  {
    type: 'OPTIMIZATION',
    keywords: [
      'optimize', 'optimise', 'optimisation', 'optimization', 'speed up',
      'reduce memory', 'performance improve', 'cache', 'caching', 'lru',
      'reduce latency', 'reduce footprint', 'resource usage',
    ],
  },
  {
    type: 'INTEGRATION',
    keywords: [
      'integrate', 'integration', 'wire together', 'connect', 'hook into',
      'plug in', 'link', 'compose engine', 'bridge', 'end-to-end',
    ],
  },
  {
    type: 'REFACTOR',
    keywords: [
      'refactor', 'clean up', 'cleanup', 'reorganize', 'restructure',
      'rename', 'move file', 'extract function', 'simplify', 'decouple',
    ],
  },
  {
    type: 'MIGRATION',
    keywords: [
      'migrate', 'migration', 'upgrade', 'port', 'convert', 'adapt',
      'transition', 'version bump',
    ],
  },
  {
    type: 'ARCHITECTURE',
    keywords: [
      'architecture', 'architectural decision', 'design pattern', 'adr',
      'system design', 'component design', 'interface design', 'api design',
      'high level design', 'module boundary',
    ],
  },
  {
    type: 'VALIDATION',
    keywords: [
      'validate', 'validation', 'verify correctness', 'confirm', 'sanity check',
      'correctness check', 'cross-check', 'double check', 'manual review',
    ],
  },
  {
    type: 'REGRESSION',
    keywords: [
      'regression', 'regression test', 'regression suite', 'regression lock',
      'regression check', 'phase8 regression', 'gate regression', 'run regression',
    ],
  },
  {
    type: 'TASK',
    keywords: [
      'implement', 'create', 'build feature', 'add feature', 'new feature',
      'develop', 'write', 'extend', 'add capability', 'task', 'feature',
    ],
  },
]);

// ---------------------------------------------------------------------------
// PMATaskType mapping table (deterministic)
// ---------------------------------------------------------------------------

const PMA_TASK_TYPE_MAP: TinyPMAToPMATaskTypeMap = Object.freeze({
  TASK: 'FEATURE',
  EXPERIMENT: 'INVESTIGATION',
  TEST: 'SIMPLE',
  RESEARCH: 'INVESTIGATION',
  BUILD: 'SIMPLE',
  AUDIT: 'SECURITY',
  BENCHMARK: 'INVESTIGATION',
  TRAINING: 'FEATURE',
  DEBUG: 'INVESTIGATION',
  OPTIMIZATION: 'REFACTOR',
  INTEGRATION: 'CROSS_SUBSYSTEM',
  REFACTOR: 'REFACTOR',
  MIGRATION: 'MIGRATION',
  ARCHITECTURE: 'ARCHITECTURAL',
  VALIDATION: 'SIMPLE',
  REGRESSION: 'SECURITY',
  UNKNOWN: 'UNKNOWN',
});

// ---------------------------------------------------------------------------
// Project vocabulary for term extraction (deterministic static list)
// ---------------------------------------------------------------------------

const PROJECT_VOCABULARY: readonly string[] = Object.freeze([
  // Core math/spatial
  '369', 'formula a', 'formula-a', '343', 'cellid', 'address369', 'spatial address',
  'coordinate', 'voxel', 'lattice',
  // Database
  'vdb', 'cubio_studio.db', 'sqlite', 'sparse memory', 'sparse memory store',
  'studio_records', 'studio_schema_version',
  // Multimodal
  'multimodal', 'fusion', 'cross-modal', 'joint representation',
  // Vision
  'luminance', 'sobel', 'dsp', 'hann', 'dft', 'pcm', 'allen temporal',
  // Language
  'native tokenizer', 'sovereign tokenization', 'language reasoning', 'proof dag',
  // Safety
  'actuation', 'is_actuation_blocked', 'sovereignty', 'frozen', 'phase8',
  'baseline', 'canonical', 'sha256', 'hash',
  // PMA
  'pma', 'project manager agent', 'tinypma', 'golden path', 'handoff contract',
  'change watcher', 'forensic', 'master index', 'capability map', 'task memory',
  // General CUBiO
  'cubio', 'cubio ai', '3d memory studio', 'native', 'one language',
  'generalization', 'consolidation', 'hypothesis', 'epistemic', 'safety guard',
  'self-verifier', 'hallucination prevention',
]);

// Subsystem keyword quick-map (projectNavigator IDs → trigger words)
const SUBSYSTEM_KEYWORD_MAP: ReadonlyArray<{ id: string; triggers: readonly string[] }> = Object.freeze([
  { id: 'SPATIAL_369',      triggers: ['369', 'formula a', '343', 'cellid', 'address369', 'spatial', 'coordinate', 'voxel', 'lattice'] },
  { id: 'DATABASE_VDB',     triggers: ['database', 'sqlite', 'vdb', 'cubio_studio.db', 'sparse memory', 'records'] },
  { id: 'NATIVE_VISION',    triggers: ['vision', 'visual', 'luminance', 'sobel', 'patch', 'image', 'dsp'] },
  { id: 'NATIVE_AUDIO',     triggers: ['audio', 'sound', 'acoustic', 'hann', 'dft', 'allen temporal', 'pcm'] },
  { id: 'MULTIMODAL_FUSION',triggers: ['fusion', 'joint representation', 'cross-modal fusion', 'multimodal'] },
  { id: 'CROSS_MODAL_GRAPH',triggers: ['graph', 'knowledge graph', 'cross-modal graph', 'multi-hop'] },
  { id: 'MEMORY_CONSOLIDATION', triggers: ['consolidation', 'deduplication', 'temporal compaction', 'sensory'] },
  { id: 'HYPOTHESIS_REASONING', triggers: ['hypothesis', 'epistemic', 'inferred', 'hypothetical', 'fact verified'] },
  { id: 'GENERALIZATION',   triggers: ['generalization', 'generalisation', 'induction', 'anti-overfit'] },
  { id: 'RUNTIME_OPTIMIZER',triggers: ['optimizer', 'optimiser', 'cache', 'lru', 'inverted index', 'paging'] },
  { id: 'SAFETY_BOUNDARY',  triggers: ['safety', 'actuation', 'lockout', 'blocked', 'output guard', 'safety guard'] },
  { id: 'ONE_LANGUAGE_NATIVE', triggers: ['tokenizer', 'vocabulary', 'language reasoning', 'proof dag', 'self-verifier', 'hallucination', 'reasoning engine'] },
  { id: 'PMA_NATIVE',       triggers: ['pma', 'project manager agent', 'handoff contract', 'change watcher', 'golden path', 'tinypma'] },
]);

// Frozen component detection
const FROZEN_COMPONENT_TRIGGERS: ReadonlyArray<{ path: string; triggers: readonly string[] }> = Object.freeze([
  { path: 'src/core/address369.ts',                triggers: ['369', 'address369', 'formula a', 'cellid', 'coordinate', 'lattice'] },
  { path: 'data/cubio_studio.db',                  triggers: ['database', 'sqlite', 'vdb', 'cubio_studio.db', 'sparse memory'] },
  { path: 'src/cubio/multimodal/native/multimodalFusionEngine.ts', triggers: ['fusion engine', 'joint representation', 'multimodalfusionengine'] },
  { path: 'src/cubio/multimodal/native/safety/multimodalSafetyGuard.ts', triggers: ['safety guard', 'outputguard', 'actuation'] },
]);

// ---------------------------------------------------------------------------
// tinyPMA Main Class
// ---------------------------------------------------------------------------

export class TinyPMA {
  public readonly is_actuation_blocked: boolean = true;

  private readonly capabilityResolver: CapabilityResolver;
  private readonly projectNavigator: ProjectNavigator;

  constructor(customRootDir?: string) {
    this.capabilityResolver = new CapabilityResolver();
    this.projectNavigator = new ProjectNavigator(customRootDir);
  }

  // -------------------------------------------------------------------------
  // PUBLIC: Main entry point
  // -------------------------------------------------------------------------

  /**
   * Interprets a user's natural-language request.
   * Returns a TinyPMAHandoff for routing to CubiOProjectManagerAgent.planTask().
   *
   * This method is DETERMINISTIC: the same prompt always produces the same output.
   */
  public interpretRequest(userPrompt: string): TinyPMAHandoff {
    const normalised = userPrompt.trim();
    if (!normalised) {
      return this.buildRejectedHandoff(userPrompt, 'UNKNOWN', 'Empty request text — cannot interpret.');
    }

    const lower = normalised.toLowerCase();

    // 1. Classify request type (deterministic keyword scoring)
    const classificationResult = this.classifyRequest(lower);
    const requestType = classificationResult.winner;

    // 2. Extract project vocabulary terms
    const extractedTerms = this.extractTerms(lower);

    // 3. Resolve subsystem scope domains
    const domains = this.resolveDomains(lower, extractedTerms.subsystemIds);

    // 4. Find related capabilities (reuse CapabilityResolver)
    const capabilityResult = this.capabilityResolver.resolveCapabilitiesForTask(normalised, domains);

    // 5. Build related engines list from matched capabilities
    const relatedEngines = this.buildRelatedEngines(capabilityResult.matchedCapabilities);

    // 6. Discover frozen dependencies
    const frozenDependencies = this.detectFrozenDependencies(lower);

    // 7. Synthesize task title
    const taskTitle = this.synthesizeTaskTitle(normalised, requestType);

    // 8. Build related tasks (from project task references in text)
    const relatedTasks = this.buildRelatedTasks(lower, extractedTerms);

    // 9. Build related experiments
    const relatedExperiments = this.buildRelatedExperiments(lower, domains);

    // 10. Build related reports
    const relatedReports = this.buildRelatedReports(domains);

    // 11. Related capabilities (names)
    const relatedCapabilities = capabilityResult.matchedCapabilities.map((c) => c.capabilityName);

    // 12. Risk assessment
    const riskFactors = this.assessRisk(lower, frozenDependencies, capabilityResult.potentialDuplicates.length > 0);

    // 13. Recommended action (reuse resolver's strategy as primary signal)
    const recommendedAction = this.resolveRecommendedAction(capabilityResult.primaryStrategy, requestType);
    const recommendationReason = this.buildRecommendationReason(
      recommendedAction,
      capabilityResult.matchedCapabilities.length,
      capabilityResult.potentialDuplicates.length
    );

    // 14. Duplicate warnings
    const duplicateWarnings = capabilityResult.potentialDuplicates.map(
      (d) => `[DUPLICATE_WARNING] ${d.component}: ${d.reason}`
    );

    // 15. Sovereignty check — block if UNKNOWN with empty terms
    const isUnknownWithNoContext =
      requestType === 'UNKNOWN' && extractedTerms.projectTerms.length === 0;

    const isApproved = !isUnknownWithNoContext && riskFactors.riskLevel !== 'CRITICAL';
    const rejectionReason =
      isUnknownWithNoContext
        ? 'UNKNOWN request type with no recognisable project context. Please clarify the intent.'
        : riskFactors.riskLevel === 'CRITICAL'
        ? `CRITICAL risk detected: ${riskFactors.riskReasons.join('; ')}`
        : undefined;

    const mappedPMATaskType: PMATaskType = PMA_TASK_TYPE_MAP[requestType];
    const interpretationId = this.generateId(normalised);

    return Object.freeze({
      interpretationId,
      requestText: normalised,
      requestType,
      taskTitle,
      extractedTerms,
      domains: Object.freeze(domains),
      relatedTasks: Object.freeze(relatedTasks),
      relatedExperiments: Object.freeze(relatedExperiments),
      relatedReports: Object.freeze(relatedReports),
      relatedEngines: Object.freeze(relatedEngines),
      relatedCapabilities: Object.freeze(relatedCapabilities),
      frozenDependencies: Object.freeze(frozenDependencies),
      riskLevel: riskFactors.riskLevel,
      riskFactors,
      recommendedAction,
      recommendationReason,
      pmaStudyScope: Object.freeze(domains),
      duplicateWarnings: Object.freeze(duplicateWarnings),
      isApprovedForPMAHandoff: isApproved,
      rejectionReason,
      mappedPMATaskType,
      timestamp: Date.now(),
    });
  }

  /**
   * Returns the internal classification result (for testing / audit).
   */
  public classifyOnly(userPrompt: string): TinyPMAClassificationResult {
    return this.classifyRequest(userPrompt.trim().toLowerCase());
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Deterministic classification engine
  // -------------------------------------------------------------------------

  private classifyRequest(lower: string): TinyPMAClassificationResult {
    const evidence: TinyPMAClassificationEvidence[] = [];

    for (const entry of CLASSIFICATION_TABLE) {
      const matched: string[] = [];
      let score = 0;

      for (const kw of entry.keywords) {
        if (lower.includes(kw)) {
          matched.push(kw);
          // Score = sum of keyword lengths (longer keywords win ties)
          score += kw.length;
        }
      }

      if (matched.length > 0) {
        evidence.push({
          candidateType: entry.type,
          matchedKeywords: Object.freeze(matched),
          score,
        });
      }
    }

    if (evidence.length === 0) {
      return {
        winner: 'UNKNOWN',
        confidence: 0,
        evidence: Object.freeze([]),
        isAmbiguous: false,
      };
    }

    // Sort by score descending, then by type name alphabetically for strict determinism
    const sorted = [...evidence].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.candidateType.localeCompare(b.candidateType);
    });

    const topScore = sorted[0].score;
    const tied = sorted.filter((e) => e.score === topScore);
    const isAmbiguous = tied.length > 1;

    // On ambiguity: pick alphabetically first (deterministic)
    const winner = sorted[0].candidateType;
    const totalScore = evidence.reduce((s, e) => s + e.score, 0);
    const confidence = Math.min(100, Math.round((topScore / totalScore) * 100));

    return {
      winner,
      confidence,
      evidence: Object.freeze(sorted),
      isAmbiguous,
    };
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Term extraction
  // -------------------------------------------------------------------------

  private extractTerms(lower: string): TinyPMAExtractedTerms {
    const projectTerms: string[] = [];
    const subsystemIds: string[] = [];
    const capabilityNames: string[] = [];
    const frozenComponents: string[] = [];
    const taskReferences: string[] = [];
    const mathReferences: string[] = [];

    // Extract project vocabulary terms
    for (const term of PROJECT_VOCABULARY) {
      if (lower.includes(term.toLowerCase())) {
        projectTerms.push(term);
      }
    }

    // Extract subsystem IDs
    for (const entry of SUBSYSTEM_KEYWORD_MAP) {
      for (const trigger of entry.triggers) {
        if (lower.includes(trigger.toLowerCase())) {
          if (!subsystemIds.includes(entry.id)) {
            subsystemIds.push(entry.id);
          }
          break;
        }
      }
    }

    // Extract capability names from registry
    const allCapabilities = this.capabilityResolver.getRegistry();
    for (const cap of allCapabilities) {
      if (
        lower.includes(cap.capabilityName.toLowerCase()) ||
        cap.implementation.toLowerCase().split(', ').some((impl) => lower.includes(impl.toLowerCase()))
      ) {
        capabilityNames.push(cap.capabilityName);
      }
    }

    // Extract frozen component references
    for (const fc of FROZEN_COMPONENT_TRIGGERS) {
      for (const trigger of fc.triggers) {
        if (lower.includes(trigger.toLowerCase())) {
          if (!frozenComponents.includes(fc.path)) {
            frozenComponents.push(fc.path);
          }
          break;
        }
      }
    }

    // Extract task/test references (task27, task28, test_pma_*, etc.)
    const taskRefRegex = /\btask\s*\d+\b|\btest_[a-z0-9_]+\b|\bt\d{2,3}\b/gi;
    const taskMatches = lower.match(taskRefRegex) || [];
    for (const m of taskMatches) {
      if (!taskReferences.includes(m)) taskReferences.push(m);
    }

    // Extract math/formula references
    const mathPatterns = ['formula a', 'formula-a', '369', '343', 'sha-256', 'sha256', 'proof dag', 'allen algebra'];
    for (const p of mathPatterns) {
      if (lower.includes(p)) mathReferences.push(p);
    }

    return Object.freeze({
      projectTerms: Object.freeze(projectTerms),
      subsystemIds: Object.freeze(subsystemIds),
      capabilityNames: Object.freeze(capabilityNames),
      frozenComponents: Object.freeze(frozenComponents),
      taskReferences: Object.freeze(taskReferences),
      mathReferences: Object.freeze(mathReferences),
    });
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Domain resolution
  // -------------------------------------------------------------------------

  private resolveDomains(lower: string, subsystemIds: readonly string[]): string[] {
    const domains: string[] = [...subsystemIds];

    // Add PMA_NATIVE domain if PMA-related terms are present
    if (
      lower.includes('pma') ||
      lower.includes('project manager') ||
      lower.includes('handoff') ||
      lower.includes('tinypma') ||
      lower.includes('change watcher')
    ) {
      if (!domains.includes('PMA_NATIVE')) domains.push('PMA_NATIVE');
    }

    // If nothing was found, fall back to 'GENERAL'
    if (domains.length === 0) {
      domains.push('GENERAL');
    }

    return domains;
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Related engines from capability matches
  // -------------------------------------------------------------------------

  private buildRelatedEngines(
    capabilities: readonly import('./types').PMACandidateCapability[]
  ): TinyPMARelatedEngine[] {
    return capabilities.map((cap) => ({
      capabilityId: cap.capabilityName.replace(/\s+/g, '_').toUpperCase(),
      capabilityName: cap.capabilityName,
      path: cap.path,
      reuseValue: cap.reuseValue,
      reuseStrategy: cap.reuseStrategy,
      relevanceScore: cap.reuseValue === 'MAXIMUM' ? 100 : cap.reuseValue === 'HIGH' ? 80 : 60,
    }));
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Frozen dependency detection
  // -------------------------------------------------------------------------

  private detectFrozenDependencies(lower: string): string[] {
    const frozen: string[] = [];
    for (const fc of FROZEN_COMPONENT_TRIGGERS) {
      for (const trigger of fc.triggers) {
        if (lower.includes(trigger.toLowerCase())) {
          if (!frozen.includes(fc.path)) frozen.push(fc.path);
          break;
        }
      }
    }
    return frozen;
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Task title synthesis
  // -------------------------------------------------------------------------

  private synthesizeTaskTitle(original: string, requestType: TinyPMARequestType): string {
    // Take first meaningful sentence (up to 80 chars), capitalise
    const firstLine = original.split(/\n/)[0].trim();
    const truncated = firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine;
    return `[${requestType}] ${truncated}`;
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Related tasks discovery (from task references in text)
  // -------------------------------------------------------------------------

  private buildRelatedTasks(
    lower: string,
    extractedTerms: TinyPMAExtractedTerms
  ): TinyPMARelatedTask[] {
    const tasks: TinyPMARelatedTask[] = [];

    // Known PMA tasks
    const knownTasks: ReadonlyArray<{ id: string; title: string; subsystem: string; keywords: readonly string[] }> = [
      { id: 'TASK-27', title: 'Native Project Manager Agent (PMA)', subsystem: 'PMA_NATIVE', keywords: ['task 27', 'task27', 'native pma', 'project manager agent'] },
      { id: 'TASK-28', title: 'Persistent Project Change Watcher', subsystem: 'PMA_NATIVE', keywords: ['task 28', 'task28', 'change watcher', 'persistent watcher'] },
      { id: 'TASK-29', title: 'tinyPMA Task & Experiment Interpreter', subsystem: 'PMA_NATIVE', keywords: ['task 29', 'task29', 'tinypma', 'tiny pma'] },
      { id: 'TASK-04', title: 'Spatial 369 Core Authority', subsystem: 'SPATIAL_369', keywords: ['task04', 'task 04', 'address369', '369 core'] },
      { id: 'TASK-114', title: 'Native Vision DSP', subsystem: 'NATIVE_VISION', keywords: ['task114', 'vision dsp', 'native vision'] },
      { id: 'TASK-124', title: 'Native Audio DSP', subsystem: 'NATIVE_AUDIO', keywords: ['task124', 'audio dsp', 'native audio'] },
      { id: 'TASK-128', title: 'Multimodal Fusion Engine', subsystem: 'MULTIMODAL_FUSION', keywords: ['task128', 'fusion engine', 'multimodal fusion'] },
    ];

    for (const known of knownTasks) {
      let score = 0;
      const matchedReasons: string[] = [];

      for (const kw of known.keywords) {
        if (lower.includes(kw)) {
          score += kw.length * 2;
          matchedReasons.push(kw);
        }
      }

      // Also match via subsystem overlap
      if (extractedTerms.subsystemIds.includes(known.subsystem)) {
        score += 10;
        matchedReasons.push(`subsystem:${known.subsystem}`);
      }

      if (score > 0) {
        tasks.push({
          taskId: known.id,
          taskTitle: known.title,
          subsystem: known.subsystem,
          relevanceScore: Math.min(100, score),
          relevanceReason: matchedReasons.join(', '),
        });
      }
    }

    return tasks.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Related experiments discovery
  // -------------------------------------------------------------------------

  private buildRelatedExperiments(lower: string, domains: readonly string[]): TinyPMARelatedExperiment[] {
    // Known experiment paths in the project
    const knownExperiments: ReadonlyArray<{
      name: string;
      path: string;
      subsystem: string;
      keywords: readonly string[];
    }> = [
      { name: 'Phase 8 Regression Lock Suite', path: 'src/test_phase8_regression_lock.ts', subsystem: 'SAFETY_BOUNDARY', keywords: ['phase8', 'regression lock', 'phase 8'] },
      { name: 'PMA Native Orchestrator Tests', path: 'src/test_pma_native_orchestrator.ts', subsystem: 'PMA_NATIVE', keywords: ['test_pma_native', 'orchestrator test', 'pma orchestrator'] },
      { name: 'PMA Change Watcher Tests', path: 'src/test_pma_change_watcher.ts', subsystem: 'PMA_NATIVE', keywords: ['test_pma_change', 'change watcher test', 'watcher test'] },
      { name: 'Spatial 343/369 Mapping Tests', path: 'src/test_spatial_343_369_mapping.ts', subsystem: 'SPATIAL_369', keywords: ['spatial 343', 'spatial 369', '369 mapping test'] },
      { name: 'Native Vision Representation Tests', path: 'src/test_native_vision_representation.ts', subsystem: 'NATIVE_VISION', keywords: ['vision representation', 'vision test'] },
      { name: 'Native Audio Representation Tests', path: 'src/test_native_audio_representation.ts', subsystem: 'NATIVE_AUDIO', keywords: ['audio representation', 'audio test'] },
      { name: 'Native Multimodal Fusion Tests', path: 'src/test_native_multimodal_fusion.ts', subsystem: 'MULTIMODAL_FUSION', keywords: ['multimodal fusion test', 'fusion test'] },
    ];

    const results: TinyPMARelatedExperiment[] = [];

    for (const exp of knownExperiments) {
      let score = 0;
      const reasons: string[] = [];

      for (const kw of exp.keywords) {
        if (lower.includes(kw)) {
          score += kw.length;
          reasons.push(kw);
        }
      }

      if (domains.includes(exp.subsystem)) {
        score += 8;
        reasons.push(`domain:${exp.subsystem}`);
      }

      if (score > 0) {
        results.push({
          name: exp.name,
          path: exp.path,
          subsystem: exp.subsystem,
          relevanceScore: Math.min(100, score),
          relevanceReason: reasons.join(', '),
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Related reports discovery
  // -------------------------------------------------------------------------

  private buildRelatedReports(domains: readonly string[]): TinyPMARelatedReport[] {
    const reportMap: ReadonlyArray<{ path: string; subsystem: string }> = [
      { path: 'PMA_TASK27_FINAL_REPORT.md', subsystem: 'PMA_NATIVE' },
      { path: 'PMA_TASK28_FINAL_REPORT.md', subsystem: 'PMA_NATIVE' },
      { path: 'src/cubio/language/native/pma/PMA_ARCHITECTURE.md', subsystem: 'PMA_NATIVE' },
      { path: 'src/cubio/language/native/pma/PMA_CHANGE_WATCHER.md', subsystem: 'PMA_NATIVE' },
      { path: 'reports/forensic/CUBIO_3D_MEMORY_STUDIO_MASTER_FORENSIC_REPORT.md', subsystem: 'GENERAL' },
      { path: 'reports/forensic/MASTER_CAPABILITY_MAP.csv', subsystem: 'GENERAL' },
      { path: 'MASTER_INDEX.md', subsystem: 'GENERAL' },
      { path: 'reports/tasks/TASK04_SPATIAL_369_REPORT.md', subsystem: 'SPATIAL_369' },
      { path: 'reports/tasks/TASK114_NATIVE_VISION_REPRESENTATION_REPORT.md', subsystem: 'NATIVE_VISION' },
      { path: 'reports/tasks/TASK124_NATIVE_AUDIO_REPRESENTATION_REPORT.md', subsystem: 'NATIVE_AUDIO' },
      { path: 'reports/tasks/TASK128_NATIVE_MULTIMODAL_FUSION_REPORT.md', subsystem: 'MULTIMODAL_FUSION' },
    ];

    const results: TinyPMARelatedReport[] = [];

    for (const r of reportMap) {
      if (domains.includes(r.subsystem) || r.subsystem === 'GENERAL') {
        const score = r.subsystem === 'GENERAL' ? 30 : 70;
        results.push({
          reportPath: r.path,
          subsystem: r.subsystem,
          relevanceScore: score,
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Risk assessment
  // -------------------------------------------------------------------------

  private assessRisk(
    lower: string,
    frozenDeps: readonly string[],
    hasDuplicateWarnings: boolean
  ): TinyPMARiskFactors {
    const riskReasons: string[] = [];

    const touchesFrozenComponent = frozenDeps.length > 0;
    const touchesDatabase = frozenDeps.includes('data/cubio_studio.db') || lower.includes('cubio_studio.db');
    const touches369 = frozenDeps.includes('src/core/address369.ts') || lower.includes('address369');
    const requestsActuation = /\bactuat\b|\bexecute command\b|\brun external\b/i.test(lower);
    const requestsExternalAI =
      /\bopenai\b|\bgpt\b|\bclaude\b|\bgemini api\b|\bcohere\b|\banthropic api\b|\bhuggingface\b|\bvertex ai\b/i.test(lower);
    const requestsDuplicateImplementation = hasDuplicateWarnings;

    const crossSubsystemScope =
      lower.includes('cross-modal') ||
      lower.includes('cross modal') ||
      /\bmultimodal\b/i.test(lower);

    if (touches369) riskReasons.push('Touches canonical 369 spatial authority (frozen, Delta=0)');
    if (touchesDatabase) riskReasons.push('Touches canonical SQLite VDB (frozen, Delta=0)');
    if (requestsActuation) riskReasons.push('Actuation keyword detected — is_actuation_blocked=true');
    if (requestsExternalAI) riskReasons.push('External AI/cloud API reference detected — sovereignty violation');
    if (requestsDuplicateImplementation) riskReasons.push('Duplicate implementation risk detected');
    if (touchesFrozenComponent && !touches369 && !touchesDatabase) {
      riskReasons.push('Frozen component reference detected');
    }

    // Risk level determination
    let riskLevel: TinyPMARiskLevel = 'LOW';
    if (requestsExternalAI || requestsActuation) {
      riskLevel = 'CRITICAL';
    } else if (requestsDuplicateImplementation || touches369 || touchesDatabase) {
      riskLevel = 'HIGH';
    } else if (touchesFrozenComponent || crossSubsystemScope) {
      riskLevel = 'MEDIUM';
    }

    return Object.freeze({
      touchesFrozenComponent,
      touchesDatabase,
      touches369,
      requestsActuation,
      requestsExternalAI,
      requestsDuplicateImplementation,
      crossSubsystemScope,
      riskLevel,
      riskReasons: Object.freeze(riskReasons),
    });
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Recommended action
  // -------------------------------------------------------------------------

  private resolveRecommendedAction(
    capabilityStrategy: PMAReuseStrategy,
    requestType: TinyPMARequestType
  ): PMAReuseStrategy {
    // For TEST, REGRESSION, AUDIT — always REUSE existing test infrastructure
    if (requestType === 'TEST' || requestType === 'REGRESSION' || requestType === 'AUDIT') {
      return 'REUSE';
    }
    // For RESEARCH — read-only, REUSE
    if (requestType === 'RESEARCH') {
      return 'REUSE';
    }
    // Otherwise defer to capability resolver's strategy
    return capabilityStrategy;
  }

  private buildRecommendationReason(
    action: PMAReuseStrategy,
    matchedCount: number,
    duplicateCount: number
  ): string {
    const parts: string[] = [];
    if (duplicateCount > 0) parts.push(`${duplicateCount} duplicate creation risk(s) detected`);
    if (matchedCount > 0) parts.push(`${matchedCount} existing capability(ies) matched`);

    switch (action) {
      case 'REUSE':
        return `${parts.length > 0 ? parts.join('; ') + '. ' : ''}Existing implementation should be imported and reused directly.`;
      case 'COMPOSE':
        return `${parts.length > 0 ? parts.join('; ') + '. ' : ''}Multiple existing capabilities should be composed into the solution.`;
      case 'EXTEND':
        return `${parts.length > 0 ? parts.join('; ') + '. ' : ''}Existing implementation should be extended rather than replaced.`;
      case 'NEW':
        return `No existing capability matches this request. A new implementation is warranted.`;
      default:
        return 'Unable to determine recommendation. Manual review required.';
    }
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Utility — deterministic ID generation (SHA-256 truncated)
  // -------------------------------------------------------------------------

  private generateId(prompt: string): string {
    const hash = crypto.createHash('sha256').update(prompt).digest('hex');
    return `tpma_${hash.slice(0, 16)}`;
  }

  // -------------------------------------------------------------------------
  // PRIVATE: Rejection handoff factory
  // -------------------------------------------------------------------------

  private buildRejectedHandoff(
    requestText: string,
    requestType: TinyPMARequestType,
    reason: string
  ): TinyPMAHandoff {
    const empty = Object.freeze([] as unknown as readonly never[]);
    const emptyTerms: TinyPMAExtractedTerms = {
      projectTerms: empty,
      subsystemIds: empty,
      capabilityNames: empty,
      frozenComponents: empty,
      taskReferences: empty,
      mathReferences: empty,
    };
    const riskFactors: TinyPMARiskFactors = {
      touchesFrozenComponent: false,
      touchesDatabase: false,
      touches369: false,
      requestsActuation: false,
      requestsExternalAI: false,
      requestsDuplicateImplementation: false,
      crossSubsystemScope: false,
      riskLevel: 'LOW',
      riskReasons: empty,
    };

    return Object.freeze({
      interpretationId: this.generateId(requestText || 'empty'),
      requestText,
      requestType,
      taskTitle: `[${requestType}] (rejected)`,
      extractedTerms: emptyTerms,
      domains: empty,
      relatedTasks: empty,
      relatedExperiments: empty,
      relatedReports: empty,
      relatedEngines: empty,
      relatedCapabilities: empty,
      frozenDependencies: empty,
      riskLevel: 'LOW' as TinyPMARiskLevel,
      riskFactors,
      recommendedAction: 'NEW' as PMAReuseStrategy,
      recommendationReason: reason,
      pmaStudyScope: empty,
      duplicateWarnings: empty,
      isApprovedForPMAHandoff: false,
      rejectionReason: reason,
      mappedPMATaskType: 'UNKNOWN' as PMATaskType,
      timestamp: Date.now(),
    });
  }
}
