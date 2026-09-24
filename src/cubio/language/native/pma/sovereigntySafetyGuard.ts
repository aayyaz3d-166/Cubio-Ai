/**
 * CUBiO AI — 3D Memory Studio
 * Task 27 — Native Project Manager Agent (PMA)
 * src/cubio/language/native/pma/sovereigntySafetyGuard.ts
 *
 * Sovereignty & Hardware Safety Guard.
 * Enforces:
 * 1. Zero External AI runtime dependencies (OpenAI, GPT, Gemini, Claude, Qwen, Llama, HuggingFace inference).
 * 2. Discrimination between static blacklist strings / test assertions vs live runtime dependencies.
 * 3. Permanent hardware actuation lockout (is_actuation_blocked = true).
 */

import { PMASecurityImpact, PMAConflictRecord } from './types';

export class SovereigntySafetyGuard {
  public readonly is_actuation_blocked: boolean = true;

  private static readonly EXTERNAL_AI_RUNTIME_PATTERNS = [
    /\b(?:import|require)\s*\(?['"](?:openai|@anthropic-ai|@google\/genai|langchain|llamaindex|pinecone|qdrant|chromadb)['"]\)?/i,
    /\b(?:https?:\/\/api\.openai\.com|https?:\/\/api\.anthropic\.com|https?:\/\/generativelanguage\.googleapis\.com)/i,
    /\b(?:new OpenAI|new Anthropic|new GoogleGenerativeAI|new PineconeClient)\b/,
    /\b(?:createChatCompletion|callOpenAI|generateTextWithClaude|queryGeminiAPI)\b/i,
  ];

  private static readonly EXTERNAL_AI_PROMPT_INTENTS = [
    /\b(?:call|connect to|integrate with|use)\s+(?:openai|gpt-?4|claude|gemini|cloud llm|remote agent|huggingface api)\b/i,
    /\b(?:add external ai|external vector db|remote embedding api)\b/i,
  ];

  private static readonly ACTUATION_PROHIBITED_PATTERNS = [
    /\b(?:actuate hardware|execute physical command|move robotic arm|switch circuit|fire thruster|trigger actuator|control physical motors|drive motor|actuate motor|move motor)\b/i,
    /\b(?:actionner le matériel|actionner le materiel|déplacer le bras robotique|activer actionneur)\b/i,
    /\b(?:hardware ansteuern|roboterarm bewegen|motor ansteuern|aktor betätigen)\b/i,
    /ہارڈویئر\s+کو?\s+چلائیں|روبوٹک\s+بازو|موٹر\s+چلائیں/u,
    /تشغيل\s+الأجهزة|تحريك\s+الذراع\s+الآلية/u,
    /执行硬件驱动|移动机械臂|触发执行器|控制物理电机/u,
  ];

  /**
   * Scans a prompt or proposed code change for sovereignty violations or actuation attempts.
   */
  public evaluateSecurityImpact(
    userPrompt: string,
    proposedContentOrCode?: string
  ): {
    impact: PMASecurityImpact;
    conflicts: readonly PMAConflictRecord[];
  } {
    const conflicts: PMAConflictRecord[] = [];
    const detectedTerms: string[] = [];

    const promptLower = userPrompt.toLowerCase();

    // 1. Actuation Interception
    const attemptsActuation =
      SovereigntySafetyGuard.ACTUATION_PROHIBITED_PATTERNS.some((pattern) => pattern.test(userPrompt)) &&
      !/\b(?:permanently blocked|cannot actuate|refuses to actuate|lockout|protection|safety)\b/i.test(promptLower);

    if (attemptsActuation) {
      conflicts.push({
        type: 'EXTERNAL_AI_DETECTED', // Using security conflict category
        component: 'src/cubio/inference/safety/outputGuard.ts',
        reason: 'Attempted hardware actuation intercepted fail-closed.',
        impact: 'Violates Section 20: PMA permanently inherits is_actuation_blocked = true. Physical actuation is prohibited.',
        safeAlternatives: [
          'Software development, simulation, and analytical modeling only.',
        ],
      });
      detectedTerms.push('HARDWARE_ACTUATION_PROHIBITED');
    }

    // 2. External AI Runtime Dependency Detection
    let isExternalAiIntent = false;
    for (const pattern of SovereigntySafetyGuard.EXTERNAL_AI_PROMPT_INTENTS) {
      if (pattern.test(userPrompt)) {
        isExternalAiIntent = true;
        detectedTerms.push(pattern.source);
        break;
      }
    }

    if (proposedContentOrCode) {
      // Discriminate between static test assertions and runtime imports
      const isTestFixture =
        proposedContentOrCode.includes('assert(') ||
        proposedContentOrCode.includes('expect(') ||
        proposedContentOrCode.includes('blacklist') ||
        proposedContentOrCode.includes('static scan');

      if (!isTestFixture) {
        for (const pattern of SovereigntySafetyGuard.EXTERNAL_AI_RUNTIME_PATTERNS) {
          if (pattern.test(proposedContentOrCode)) {
            isExternalAiIntent = true;
            detectedTerms.push(pattern.source);
            break;
          }
        }
      }
    }

    if (isExternalAiIntent) {
      conflicts.push({
        type: 'EXTERNAL_AI_DETECTED',
        component: 'SOVEREIGNTY_SECURITY_GATE',
        reason: 'External AI API / cloud model integration requested.',
        impact: 'Violates Section 19: CUBiO AI must operate 100% sovereign and offline with zero cloud inference.',
        safeAlternatives: [
          'Use existing native One Language models in src/cubio/language/native/',
          'Use native discrete multimodal representations in src/cubio/multimodal/native/',
        ],
      });
    }

    const externalAiDetected = isExternalAiIntent;

    return {
      impact: {
        externalAiDetected,
        isActuationBlocked: this.is_actuation_blocked,
        isOfflineOnly: true,
        detectedTerms: Object.freeze(detectedTerms),
      },
      conflicts: Object.freeze(conflicts),
    };
  }

  /**
   * Validates that an existing code snippet only mentions external AI names in safe contexts
   * (such as test assertions or blacklists) without active runtime calls.
   */
  public isBenignStaticMention(codeOrText: string): boolean {
    const hasLiveCall = SovereigntySafetyGuard.EXTERNAL_AI_RUNTIME_PATTERNS.some((p) => p.test(codeOrText));
    return !hasLiveCall;
  }
}
