/**
 * CUBiO AI — PMA Task 420: Native1M + Core Intelligence Integration
 * src/cubio/integration/mvpV2CoreIntelligenceManager.ts
 *
 * Production intelligence manager integrating the certified Native 1M runtime
 * and sovereign CUBiO Core intelligence into MVP Version 2.
 *
 * Key Invariants & Architectural Constraints:
 * 1. Checkpoint strictly read-only: data/checkpoints/phase16_production_final_sealed_1m.3dmemory
 *    Size: 6,038,463 bytes | SHA-256: 453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8
 *    Weights State Hash: 0942c34c1ad6d725063072e37f6d7a5e91537d6e894988f551605bb3691e7c37
 * 2. Pure Sovereign Intelligence: Zero external foundation models (no OpenAI, Claude, HuggingFace, Ollama, Qwen, Llama).
 * 3. Exact Universal Accounting: 971,520 parameters across 53 tensors (FP32, 6 layers, d=128, 4 heads).
 * 4. Permanent Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently asserted.
 * 5. Spatial HCP Lattice Grounding: All 343 spatial cells [0..342] map to Address 369 [26..368] via Formula A.
 * 6. 7-Tier Epistemic Classification: FACT, DERIVATION, OBSERVATION, HYPOTHESIS, PREDICTION, ASSUMPTION, UNKNOWN.
 * 7. Documented Architectural Bounds: Context budget 128 tokens, sub-50ms latency target, offline isolated.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';

import {
  Native1MProductionService,
  Native1MServiceStatus,
  Native1MModelMetadata,
  Native1MPromptEvaluation,
  NATIVE_1M_PRODUCTION_CHECKPOINT_PATH,
  EXPECTED_NATIVE_1M_CHECKPOINT_SIZE,
  EXPECTED_NATIVE_1M_CHECKPOINT_SHA256,
  EXPECTED_NATIVE_1M_STATE_HASH,
  EXPECTED_NATIVE_1M_PARAMETERS,
  EXPECTED_NATIVE_1M_TENSORS,
  IS_ACTUATION_BLOCKED,
} from '../inference/native1mProductionService';
import { SCALED_1M_CONFIG } from '../scaling/parameterScalingEngine';
import { CubiOChatEngine } from '../intelligence/chat/chatEngine';
import { CubiOAICoreEngine } from '../intelligence/core/coreEngine';
import { ChatRequest, ChatResponse } from '../intelligence/chat/chatEngineContract';
import { EpistemicStatus, NativeInferenceOptions, NativeInferenceOutput } from '../model/native_foundation/native_model_types';
import { ExternalModelGuard } from '../model/native_foundation/external_model_guard';
import {
  cellIdToAddress369,
  cellIdToCoordinate,
  validateCellId,
  TOTAL_SPATIAL_CELLS,
} from '../../core/address369';

export { IS_ACTUATION_BLOCKED };

export interface Native1MCapabilityLimitations {
  readonly maxSequenceLengthTokens: number;
  readonly parameterCount: number;
  readonly tensorCount: number;
  readonly layerCount: number;
  readonly hiddenDimension: number;
  readonly attentionHeads: number;
  readonly vocabSize: number;
  readonly spatialHcpCells: number;
  readonly epistemicClassesCount: number;
  readonly isActuationBlocked: boolean;
  readonly isExternalModelBlocked: boolean;
  readonly targetLatencyBudgetMs: number;
  readonly contextOverflowBehavior: string;
}

export interface CoreIntelligenceStatus {
  readonly status: 'READY' | 'INITIALIZING' | 'ERROR';
  readonly native1mStatus: Native1MServiceStatus;
  readonly stateHash: string;
  readonly parameters: number;
  readonly tensorCount: number;
  readonly chatEngineReady: boolean;
  readonly coreEngineReady: boolean;
  readonly actuationLocked: boolean;
  readonly limitations: Native1MCapabilityLimitations;
  readonly timestamp: string;
}

export class MvpV2CoreIntelligenceManager {
  private static instance: MvpV2CoreIntelligenceManager | null = null;

  private nativeService: Native1MProductionService;
  private chatEngine: CubiOChatEngine;
  private coreEngine: CubiOAICoreEngine;

  private isInitialized = false;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED_SECURITY: Hardware actuation lockout is violated (IS_ACTUATION_BLOCKED must be true)');
    }
    this.nativeService = Native1MProductionService.getInstance();
    this.chatEngine = CubiOChatEngine.getInstance();
    this.coreEngine = CubiOAICoreEngine.getInstance();
  }

  public static getInstance(): MvpV2CoreIntelligenceManager {
    if (!this.instance) {
      this.instance = new MvpV2CoreIntelligenceManager();
    }
    return this.instance;
  }

  /**
   * Cold-start boot and state restoration verification for the Native 1M model.
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized && this.nativeService.isReady()) {
      return true;
    }

    const success = await this.nativeService.initialize();
    if (success) {
      this.isInitialized = true;
    }
    return success;
  }

  /**
   * Diagnostic status query including model parameters, state hash, and limitation specifications.
   */
  public getStatus(): CoreIntelligenceStatus {
    const meta: Native1MModelMetadata = this.nativeService.getModelMetadata();

    return {
      status: this.isInitialized && this.nativeService.isReady() ? 'READY' : 'INITIALIZING',
      native1mStatus: meta.status,
      stateHash: meta.stateHash,
      parameters: meta.parameters,
      tensorCount: meta.tensorCount,
      chatEngineReady: this.chatEngine !== null,
      coreEngineReady: this.coreEngine !== null,
      actuationLocked: IS_ACTUATION_BLOCKED === true,
      limitations: this.getCapabilityLimitations(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns explicit, documented architectural bounds and capability limitations of the Native 1M model.
   */
  public getCapabilityLimitations(): Native1MCapabilityLimitations {
    return {
      maxSequenceLengthTokens: SCALED_1M_CONFIG.maxSequenceLength, // 128 tokens
      parameterCount: EXPECTED_NATIVE_1M_PARAMETERS, // 971,520
      tensorCount: EXPECTED_NATIVE_1M_TENSORS, // 53 tensors
      layerCount: SCALED_1M_CONFIG.layerCount, // 6 layers
      hiddenDimension: SCALED_1M_CONFIG.hiddenDimension, // 128
      attentionHeads: SCALED_1M_CONFIG.attentionHeads, // 4 heads
      vocabSize: SCALED_1M_CONFIG.vocabSize, // 478 tokens
      spatialHcpCells: TOTAL_SPATIAL_CELLS, // 343 cells
      epistemicClassesCount: SCALED_1M_CONFIG.epistemicClasses, // 7 tiers
      isActuationBlocked: true,
      isExternalModelBlocked: true,
      targetLatencyBudgetMs: 50.0,
      contextOverflowBehavior: 'Deterministic truncation to maxSequenceLengthTokens (128)',
    };
  }

  /**
   * Evaluates a prompt forward pass through the sealed Native 1M model.
   * Produces next-token prediction, loss, epistemic classification, and spatial Address 369 grounding.
   */
  public evaluatePrompt(prompt: string, spatialCellId?: number): Native1MPromptEvaluation {
    return this.nativeService.evaluatePrompt(prompt, spatialCellId);
  }

  /**
   * Generates autoregressive completion from the sealed Native 1M model.
   */
  public generate(prompt: string, options: NativeInferenceOptions = {}, spatialCellId?: number): NativeInferenceOutput {
    return this.nativeService.generate(prompt, options, spatialCellId);
  }

  /**
   * Executes conversational turn through CUBiOChatEngine with Native 1M and canonical context integration.
   */
  public async executeChatTurn(request: ChatRequest): Promise<ChatResponse> {
    return this.chatEngine.executeChat(request);
  }

  /**
   * Validates spatial projection for a given cellId adhering to Formula A.
   */
  public projectSpatialCell(cellId: number): {
    cellId: number;
    address369: number;
    coordinates: { x: number; y: number; z: number };
    reconstructedCellId: number;
    isLossless: boolean;
  } {
    validateCellId(cellId);
    const address369 = cellIdToAddress369(cellId);
    const coords = cellIdToCoordinate(cellId);
    const reconstructedCellId = coords.x + 7 * coords.y + 49 * coords.z;

    return {
      cellId,
      address369,
      coordinates: coords,
      reconstructedCellId,
      isLossless: reconstructedCellId === cellId && address369 === 26 + cellId,
    };
  }

  /**
   * Verifies fail-closed actuation and anti-contamination filters against a candidate input.
   */
  public testSafetyGuards(input: string): {
    isActuationBlocked: boolean;
    isExternalModelBlocked: boolean;
  } {
    let actuationBlocked = false;
    let externalModelBlocked = false;

    try {
      ExternalModelGuard.assertActuationBlocked(input);
    } catch {
      actuationBlocked = true;
    }

    try {
      ExternalModelGuard.assertNativeOnly(input);
    } catch {
      externalModelBlocked = true;
    }

    return {
      isActuationBlocked: actuationBlocked,
      isExternalModelBlocked: externalModelBlocked,
    };
  }
}
