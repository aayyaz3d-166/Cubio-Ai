/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F30: Real Chat Testing & Prompt Benchmark Suite (Types & Contracts)
 *
 * Master specifications for real-world prompt evaluation, test case categories,
 * validation invariants, and benchmarking reports.
 */

import { CubiODimension, CubiOHarmonic369 } from '../../types';
import { CubiOState } from '../../state/types';
import { UserIntentCategory } from '../intent_router/types';
import { InteractionMode } from '../chat_api/types';

// ─── 10 Real-World Prompt Categories ──────────────────────────────────────

export type PromptTestCategory =
  | 'GREETING_CASUAL'
  | 'HARMONIC_369_VORTEX'
  | 'SPATIAL_DIMENSION_ANALYSIS'
  | 'DEDUCTIVE_GEOMETRIC_REASONING'
  | 'STATE_TRAJECTORY_PREDICTION'
  | 'MULTI_CRITERIA_DECISION'
  | 'MULTI_TURN_CONVERSATION'
  | 'MULTIMODAL_SENSORY_SYNTHESIS'
  | 'ADVERSARIAL_EDGE_DEFENSE'
  | 'ZERO_DEBUG_LEAK_AUDIT';

// ─── Prompt Test Case Definition ──────────────────────────────────────────

export interface PromptTestCase {
  readonly id: string;
  readonly category: PromptTestCategory;
  readonly title: string;
  readonly prompt: string;
  readonly mode?: InteractionMode;
  readonly activeDimension?: CubiODimension;
  readonly baseState?: CubiOState;
  readonly harmonic?: Partial<CubiOHarmonic369>;
  readonly conversationId?: string;
  readonly expectedIntent?: UserIntentCategory;
  readonly expectedKeywords?: readonly string[];
  readonly mustNotContain?: readonly string[];
  readonly minConfidence?: number; // default 0.90
  readonly maxLatencyMs?: number; // default 50ms
  readonly multiTurnFollowUps?: readonly {
    readonly followUpPrompt: string;
    readonly expectedContextResolution: string;
  }[];
}

// ─── Execution Result for an Individual Prompt ───────────────────────────

export interface PromptTestExecutionResult {
  readonly testId: string;
  readonly category: PromptTestCategory;
  readonly prompt: string;
  readonly success: boolean;
  readonly textOutput: string;
  readonly confidence: number;
  readonly resonanceScore: number;
  readonly activeDimension: CubiODimension;
  readonly latencyMs: number;
  readonly hasDebugLogLeaks: boolean;
  readonly leakedPatternsFound: readonly string[];
  readonly validationErrors: readonly string[];
  readonly isIntentMatched: boolean;
  readonly isKeywordsMatched: boolean;
  readonly executionChecksum: string;
  readonly timestamp: number;
}

// ─── Category-Level Aggregated Metrics ───────────────────────────────────

export interface CategoryBenchmarkMetrics {
  readonly category: PromptTestCategory;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly passRate: number; // 0.0 .. 1.0
  readonly avgLatencyMs: number;
  readonly avgConfidence: number;
  readonly avgResonanceScore: number;
  readonly leakFreeRate: number; // 1.0 = 100% leak free
}

// ─── Comprehensive Benchmark Report ──────────────────────────────────────

export interface RealChatBenchmarkReport {
  readonly benchmarkId: string;
  readonly totalPromptsTested: number;
  readonly overallPassed: number;
  readonly overallFailed: number;
  readonly overallPassRate: number;
  readonly categoryMetrics: Record<PromptTestCategory, CategoryBenchmarkMetrics>;
  readonly overallAvgLatencyMs: number;
  readonly p99LatencyMs: number;
  readonly overallLeakFreeRate: number;
  readonly benchmarkGrade: 'S_TIER' | 'A_TIER' | 'B_TIER' | 'FAILED';
  readonly isProductionCertified: boolean;
  readonly results: readonly PromptTestExecutionResult[];
  readonly reportChecksum: string;
  readonly timestamp: number;
}
