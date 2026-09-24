/**
 * CUBiO AI — PMA Task 421: Universal Chat End-to-End Integration
 * src/cubio/integration/mvpV2UniversalChatManager.ts
 *
 * Universal Chat Orchestrator for CUBiO AI MVP Version 2.
 * Validates and coordinates universal AI assistant interactions across:
 * - Multi-domain reasoning: General queries, explanations, problem-solving, coding, writing, planning, math.
 * - Multilingual fluency: English, Roman Urdu, mixed-language conversational inputs.
 * - VDB grounding: Factual enhancement without exposing internal architecture, tables, or spatial formulas.
 * - Contextual continuity: Multi-turn coherence, reference resolution, monotonic turn sequence.
 * - Anti-fallback reasoning: Genuine reasoning pipelines execute without displacement by generic fallback templates.
 * - Graceful uncertainty: Honest epistemic qualification and abstention when evidence is insufficient.
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';

import { CubiOChatEngine } from '../intelligence/chat/chatEngine';
import { ChatRequest, ChatResponse, IS_ACTUATION_BLOCKED } from '../intelligence/chat/chatEngineContract';
import { MvpV2ProductionIntegrationService } from './mvpV2ProductionIntegrationService';
import { MvpV2GroundedIntegrationManager } from './mvpV2GroundedIntegrationManager';
import { EpistemicStatus } from '../model/native_foundation/native_model_types';
import { OutputGuard } from '../inference/safety/outputGuard';

export { IS_ACTUATION_BLOCKED };

export type ChatDomainCategory =
  | 'GENERAL_QUESTION'
  | 'EXPLANATION'
  | 'PROBLEM_SOLVING'
  | 'CODING'
  | 'WRITING'
  | 'PLANNING'
  | 'MATH'
  | 'FOLLOW_UP';

export type DetectedLanguage = 'ENGLISH' | 'ROMAN_URDU' | 'MIXED';

export interface UniversalChatEvaluation {
  readonly query: string;
  readonly domain: ChatDomainCategory;
  readonly detectedLanguage: DetectedLanguage;
  readonly responseText: string;
  readonly confidence: number;
  readonly epistemicStatus: string;
  readonly turnSequence: number;
  readonly latencyMs: number;
  readonly isGrounded: boolean;
  readonly architecturalSanitizationPassed: boolean;
  readonly fallbackDisplaced: boolean;
  readonly isSafe: boolean;
}

export interface MultiTurnSessionRecord {
  readonly conversationId: string;
  readonly turnCount: number;
  readonly history: readonly UniversalChatEvaluation[];
}

export class MvpV2UniversalChatManager {
  private static instance: MvpV2UniversalChatManager | null = null;

  private chatEngine: CubiOChatEngine;
  private productionService: MvpV2ProductionIntegrationService;
  private groundedManager: MvpV2GroundedIntegrationManager;

  // Forbidden internal architectural tokens that MUST NOT appear in external chat responses
  private static readonly FORBIDDEN_ARCHITECTURE_TOKENS = [
    'record_json',
    'cubio_studio.db',
    'Phase26VdbReadOnlyAdapter',
    'VdbGroundedStateGenerator',
    'CompactStateAddressingEngine',
    'sqlite_master',
    'PRAGMA integrity_check',
    'Formula A: 26 + cellId',
  ];

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED_SECURITY: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
    this.chatEngine = CubiOChatEngine.getInstance();
    this.productionService = MvpV2ProductionIntegrationService.getInstance();
    this.groundedManager = new MvpV2GroundedIntegrationManager();
  }

  public static getInstance(): MvpV2UniversalChatManager {
    if (!this.instance) {
      this.instance = new MvpV2UniversalChatManager();
    }
    return this.instance;
  }

  /**
   * Detects whether input is English, Roman Urdu, or Mixed language.
   */
  public detectLanguage(input: string): DetectedLanguage {
    const text = input.toLowerCase();

    // Explicit language override directives
    if (/\b(?:in\s+english|english\s+mein|english\s+me|respond\s+in\s+english|reply\s+in\s+english)\b/i.test(text)) {
      return 'ENGLISH';
    }
    if (/\b(?:in\s+roman\s+urdu|roman\s+urdu\s+mein|roman\s+urdu\s+me|sirf\s+urdu|in\s+urdu|urdu\s+mein|urdu\s+me)\b/i.test(text)) {
      return 'ROMAN_URDU';
    }

    const romanUrduKeywords = [
      'kya', 'kia', 'kea', 'hai', 'hain', 'hy', 'hein', 'kaise', 'kese', 'kaisay',
      'mujhe', 'mujhy', 'mjhe', 'mjy', 'mujhko', 'batao', 'btao', 'btaein', 'batayein',
      'chahiye', 'chahye', 'chahiya', 'chaiye', 'shukriya', 'shukria', 'aap', 'ap',
      'kaun', 'theek', 'thk', 'thek', 'mein', 'me', 'hum', 'samjhao', 'smjhao', 'smjh',
      'karein', 'krein', 'hoga', 'mera', 'meri', 'meray', 'karo', 'kro', 'kar do', 'kr do',
      'suno', 'zaroorat', 'zroorat', 'masla', 'hal', 'dikhao', 'dkhao', 'bhi', 'b', 'bana'
    ];

    const tokens = text.split(/\s+/).map(t => t.replace(/[^a-z0-9]/g, ''));
    let urduMatches = 0;
    for (const t of tokens) {
      if (romanUrduKeywords.includes(t)) {
        urduMatches++;
      }
    }

    if (urduMatches >= 2 && tokens.length <= 8) return 'ROMAN_URDU';
    if (urduMatches >= 3) return 'ROMAN_URDU';
    if (urduMatches >= 1) return 'MIXED';
    return 'ENGLISH';
  }

  /**
   * Classifies chat query into multi-domain taxonomy.
   */
  public classifyDomain(prompt: string): ChatDomainCategory {
    const p = prompt.toLowerCase();

    if (p.includes('+') || p.includes('*') || p.includes('calculate') || p.includes('square root') || p.includes('math') || /\b\d+\s*[+\-*\/]\s*\d+\b/.test(p)) {
      return 'MATH';
    }
    if (p.includes('function') || p.includes('code') || p.includes('typescript') || p.includes('python') || p.includes('bug') || p.includes('refactor') || p.includes('const ') || p.includes('def ')) {
      return 'CODING';
    }
    if (p.includes('plan') || p.includes('roadmap') || p.includes('schedule') || p.includes('steps to') || p.includes('strategy')) {
      return 'PLANNING';
    }
    if (p.includes('write') || p.includes('essay') || p.includes('summary') || p.includes('email') || p.includes('draft') || p.includes('poem')) {
      return 'WRITING';
    }
    if (p.includes('why') || p.includes('how does') || p.includes('explain') || p.includes('samjhao') || p.includes('what is')) {
      return 'EXPLANATION';
    }
    if (p.includes('solve') || p.includes('fix') || p.includes('issue') || p.includes('problem') || p.includes('masla')) {
      return 'PROBLEM_SOLVING';
    }
    if (p.includes('it') || p.includes('and that') || p.includes('also') || p.includes('what about') || p.includes('follow up') || p.includes('aur')) {
      return 'FOLLOW_UP';
    }
    return 'GENERAL_QUESTION';
  }

  /**
   * Sanitizes output and verifies absence of internal architectural leaks.
   */
  public verifyArchitecturalSanitization(responseText: string): boolean {
    for (const forbidden of MvpV2UniversalChatManager.FORBIDDEN_ARCHITECTURE_TOKENS) {
      if (responseText.includes(forbidden)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Redacts any internal architectural tokens from output text fail-closed.
   */
  public sanitizeResponseText(text: string): string {
    let sanitized = text;
    for (const token of MvpV2UniversalChatManager.FORBIDDEN_ARCHITECTURE_TOKENS) {
      if (sanitized.includes(token)) {
        sanitized = sanitized.split(token).join('[CONFIDENTIAL_SYSTEM_ARCHITECTURE]');
      }
    }
    return sanitized;
  }

  /**
   * Verifies that generic fallback templates do NOT displace genuine reasoning.
   */
  public isGenericFallbackDisplacingReasoning(response: ChatResponse, domain: ChatDomainCategory): boolean {
    const text = response.text.toLowerCase();
    const genericFallbackPhrases = [
      'i am a generic ai model and cannot answer',
      'error processing your request please try again later',
      'an unexpected internal error occurred',
      'system unavailable',
    ];

    for (const phrase of genericFallbackPhrases) {
      if (text.includes(phrase)) {
        return true;
      }
    }

    if (domain === 'MATH') {
      const hasNumber = /\d+/.test(text);
      if (!hasNumber) return true;
    }
    if (domain === 'CODING') {
      const hasCodeStructure = text.includes('`') || text.includes('function') || text.includes('return') || text.includes('def ') || text.includes('const');
      if (!hasCodeStructure) return true;
    }

    return false;
  }

  /**
   * Executes a single turn through the universal chat pipeline with full forensic evaluation.
   */
  public async executeUniversalTurn(
    message: string,
    conversationId: string = "conv_univ_" + Date.now(),
    sessionId: string = "sess_univ_" + Date.now(),
    options: { spatialCellId?: number; tenantId?: string; userId?: string } = {}
  ): Promise<UniversalChatEvaluation> {
    const t0 = performance.now();
    const domain = this.classifyDomain(message);
    const language = this.detectLanguage(message);

    const request: ChatRequest = {
      requestId: "req_univ_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      conversationId,
      sessionId,
      tenantId: options.tenantId || 'tenant_default',
      userId: options.userId || 'user_default',
      message,
      options: options.spatialCellId !== undefined ? { spatialCellId: options.spatialCellId } : undefined,
    };

    const chatResponse = await this.chatEngine.executeChat(request);
    const latencyMs = Number((performance.now() - t0).toFixed(2));

    const sanitizedResponseText = this.sanitizeResponseText(chatResponse.text);
    const sanitizationPassed = this.verifyArchitecturalSanitization(sanitizedResponseText);
    const fallbackDisplaced = this.isGenericFallbackDisplacingReasoning(chatResponse, domain);
    const guardCheck = OutputGuard.validateOutput(sanitizedResponseText);

    return {
      query: message,
      domain,
      detectedLanguage: language,
      responseText: sanitizedResponseText,
      confidence: chatResponse.confidence,
      epistemicStatus: chatResponse.epistemicState || 'FACT',
      turnSequence: chatResponse.sequence,
      latencyMs,
      isGrounded: (chatResponse.turn?.memoryReferences && chatResponse.turn.memoryReferences.length > 0) || false,
      architecturalSanitizationPassed: sanitizationPassed,
      fallbackDisplaced,
      isSafe: guardCheck.isSafe && chatResponse.isActuationBlocked === true,
    };
  }

  /**
   * Executes a multi-turn conversation assessing context continuity across turns.
   */
  public async executeMultiTurnDialogue(
    conversationId: string,
    turns: readonly string[]
  ): Promise<MultiTurnSessionRecord> {
    const sessionId = "sess_" + conversationId;
    const history: UniversalChatEvaluation[] = [];

    for (const turnMessage of turns) {
      const evaluation = await this.executeUniversalTurn(turnMessage, conversationId, sessionId);
      history.push(evaluation);
    }

    return {
      conversationId,
      turnCount: history.length,
      history,
    };
  }
}
